import type {YaMakeParsed} from '../src/lib/ya-make/ya-make';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {join} from 'node:path';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';

import {assembleDir, parseYaMake, resolveTarget} from '../src/lib/ya-make/ya-make';

const ROOT = '/root';

const makeParsed = (overrides: Partial<YaMakeParsed> = {}): YaMakeParsed => ({
    arcadiaRoot: ROOT,
    docsDir: undefined,
    copyFiles: [],
    includeSources: [],
    ...overrides,
});

describe('parseYaMake', () => {
    let dir: string;
    let yamakePath: string;

    beforeEach(() => {
        dir = join(tmpdir(), `ya-make-test-${Date.now()}`);
        mkdirSync(dir, {recursive: true});
        yamakePath = join(dir, 'ya.make');
    });

    afterEach(() => {
        rmSync(dir, {recursive: true, force: true});
    });

    it('parses DOCS_DIR', () => {
        writeFileSync(yamakePath, 'DOCS_DIR(docs/project/common)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsDir).toBe(join(ROOT, 'docs/project/common'));
    });

    it('parses DOCS_COPY_FILES with ARCADIA_ROOT substitution', () => {
        writeFileSync(
            yamakePath,
            'DOCS_COPY_FILES(\n   FROM ${ARCADIA_ROOT}/docs/common/ru/ NAMESPACE ru feedback.md\n)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.copyFiles).toHaveLength(1);
        expect(result.copyFiles[0]).toEqual({
            from: join(ROOT, 'docs/common/ru'),
            namespace: 'ru',
            files: ['feedback.md'],
        });
    });

    it('parses multiple DOCS_COPY_FILES blocks', () => {
        writeFileSync(
            yamakePath,
            [
                'DOCS_COPY_FILES(FROM ${ARCADIA_ROOT}/a/ NAMESPACE ru a.md)',
                'DOCS_COPY_FILES(FROM ${ARCADIA_ROOT}/b/ NAMESPACE ru/sub b.md c.md)',
            ].join('\n'),
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.copyFiles).toHaveLength(2);
        expect(result.copyFiles[1].files).toEqual(['b.md', 'c.md']);
    });

    it('resolves ${CURDIR} in DOCS_COPY_FILES FROM path', () => {
        writeFileSync(
            yamakePath,
            'DOCS_COPY_FILES(FROM ${CURDIR}/assets NAMESPACE ru img.png)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.copyFiles[0].from).toBe(join(dir, 'assets'));
    });

    it('parses DOCS_INCLUDE_SOURCES', () => {
        writeFileSync(yamakePath, 'DOCS_INCLUDE_SOURCES(src/lib/api.go src/lib/types.go)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.includeSources).toEqual([
            join(ROOT, 'src/lib/api.go'),
            join(ROOT, 'src/lib/types.go'),
        ]);
    });

    it('returns empty collections when macros are absent', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsDir).toBeUndefined();
        expect(result.copyFiles).toHaveLength(0);
        expect(result.includeSources).toHaveLength(0);
    });
});

describe('resolveTarget', () => {
    const assembled = '/out/assembled';

    it('maps file inside docsDir', () => {
        const parsed = makeParsed({docsDir: `${ROOT}/docs/common`});
        const result = resolveTarget(`${ROOT}/docs/common/ru/index.md`, parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/index.md'));
    });

    it('maps DOCS_COPY_FILES file to its namespace', () => {
        const parsed = makeParsed({
            copyFiles: [{from: `${ROOT}/devops/ru`, namespace: 'ru', files: ['feedback.md']}],
        });
        const result = resolveTarget(`${ROOT}/devops/ru/feedback.md`, parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/feedback.md'));
    });

    it('maps DOCS_INCLUDE_SOURCES file preserving arcadia-relative path', () => {
        const parsed = makeParsed({
            includeSources: [`${ROOT}/src/lib/api.go`],
        });
        const result = resolveTarget(`${ROOT}/src/lib/api.go`, parsed, assembled);
        expect(result).toBe(join(assembled, 'src/lib/api.go'));
    });

    it('ignores DOCS_COPY_FILES file not in files list', () => {
        const parsed = makeParsed({
            copyFiles: [{from: `${ROOT}/devops/ru`, namespace: 'ru', files: ['feedback.md']}],
        });
        expect(resolveTarget(`${ROOT}/devops/ru/other.md`, parsed, assembled)).toBeNull();
    });

    it('returns null for unrelated path', () => {
        expect(resolveTarget('/unrelated/file.md', makeParsed(), assembled)).toBeNull();
    });
});

describe('assembleDir', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = join(tmpdir(), `ya-make-assemble-${Date.now()}`);
        mkdirSync(tmp, {recursive: true});
    });

    afterEach(() => {
        rmSync(tmp, {recursive: true, force: true});
    });

    it('copies DOCS_DIR contents', async () => {
        const docsDir = join(tmp, 'common');
        mkdirSync(join(docsDir, 'ru'), {recursive: true});
        writeFileSync(join(docsDir, 'ru/index.md'), '# Index');

        const out = join(tmp, 'out');
        await assembleDir(out, tmp, makeParsed({docsDir}));

        expect(readFileSync(join(out, 'ru/index.md'), 'utf8')).toBe('# Index');
    });

    it('copies DOCS_COPY_FILES to namespace path', async () => {
        const src = join(tmp, 'devops');
        mkdirSync(src);
        writeFileSync(join(src, 'feedback.md'), 'feedback');

        const out = join(tmp, 'out');
        const parsed = makeParsed({
            copyFiles: [{from: src, namespace: 'ru', files: ['feedback.md']}],
        });

        await assembleDir(out, tmp, parsed);

        expect(readFileSync(join(out, 'ru/feedback.md'), 'utf8')).toBe('feedback');
    });

    it('copies DOCS_INCLUDE_SOURCES preserving arcadia-relative path', async () => {
        const arcadia = join(tmp, 'arcadia');
        mkdirSync(join(arcadia, 'src/lib'), {recursive: true});
        writeFileSync(join(arcadia, 'src/lib/api.go'), 'package lib');

        const out = join(tmp, 'out');
        const parsed = makeParsed({
            arcadiaRoot: arcadia,
            includeSources: [join(arcadia, 'src/lib/api.go')],
        });

        await assembleDir(out, tmp, parsed);

        expect(readFileSync(join(out, 'src/lib/api.go'), 'utf8')).toBe('package lib');
    });

    it('overrides .yfm from original input', async () => {
        const docsDir = join(tmp, 'common');
        mkdirSync(docsDir);
        writeFileSync(join(docsDir, '.yfm'), 'from: common');
        writeFileSync(join(tmp, '.yfm'), 'from: target');

        const out = join(tmp, 'out');
        await assembleDir(out, tmp, makeParsed({docsDir}));

        expect(readFileSync(join(out, '.yfm'), 'utf8')).toBe('from: target');
    });

    it('skips missing files without error', async () => {
        const out = join(tmp, 'out');
        const parsed = makeParsed({
            copyFiles: [{from: '/nonexistent', namespace: 'ru', files: ['missing.md']}],
        });

        await assembleDir(out, tmp, parsed);

        expect(existsSync(join(out, 'ru/missing.md'))).toBe(false);
    });

    it('recreates assembledDir on each call', async () => {
        const out = join(tmp, 'out');
        mkdirSync(out);
        writeFileSync(join(out, 'stale.md'), 'stale');

        await assembleDir(out, tmp, makeParsed());

        expect(existsSync(join(out, 'stale.md'))).toBe(false);
    });
});
