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
    docsConfig: undefined,
    copyFiles: [],
    includeSources: [],
    peerDirs: [],
    copyFileSingle: [],
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

    it('parses PEERDIR', () => {
        writeFileSync(yamakePath, 'PEERDIR(\n    docs/shared/lib\n    docs/common/icons\n)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.peerDirs).toEqual([
            join(ROOT, 'docs/shared/lib'),
            join(ROOT, 'docs/common/icons'),
        ]);
    });

    it('parses COPY_FILE relative to ya.make directory', () => {
        writeFileSync(yamakePath, 'COPY_FILE(assets/logo.png ru/logo.png)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.copyFileSingle).toEqual([
            {src: join(dir, 'assets/logo.png'), dst: 'ru/logo.png'},
        ]);
    });

    it('resolves ${ARCADIA_ROOT} in COPY_FILE src', () => {
        writeFileSync(
            yamakePath,
            'COPY_FILE(${ARCADIA_ROOT}/shared/style.css _assets/style.css)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.copyFileSingle[0].src).toBe(join(ROOT, 'shared/style.css'));
    });

    it('ignores commented-out directives', () => {
        writeFileSync(
            yamakePath,
            '# DOCS_DIR(docs/should/be/ignored)\n## section\nDOCS(html)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsDir).toBeUndefined();
    });

    it('returns empty collections when macros are absent', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsDir).toBeUndefined();
        expect(result.docsConfig).toBeUndefined();
        expect(result.copyFiles).toHaveLength(0);
        expect(result.includeSources).toHaveLength(0);
        expect(result.peerDirs).toHaveLength(0);
        expect(result.copyFileSingle).toHaveLength(0);
    });

    it('parses DOCS_CONFIG with relative path', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nDOCS_CONFIG(.yfm)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(dir, '.yfm'));
    });

    it('parses DOCS_CONFIG with config.yml', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nDOCS_CONFIG(config.yml)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(dir, 'config.yml'));
    });

    it('resolves ${DOCS_ROOT} in DOCS_CONFIG to curDir when DOCS_DIR is absent', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nDOCS_CONFIG(${DOCS_ROOT}/index.yml)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(dir, 'index.yml'));
    });

    it('resolves ${DOCS_ROOT} in DOCS_CONFIG to docsDir when DOCS_DIR is present', () => {
        writeFileSync(
            yamakePath,
            'DOCS_DIR(docs/project/common)\nDOCS_CONFIG(${DOCS_ROOT}/index.yml)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(ROOT, 'docs/project/common', 'index.yml'));
    });

    it('resolves ${ARCADIA_ROOT} in DOCS_CONFIG', () => {
        writeFileSync(
            yamakePath,
            'DOCS(html)\nDOCS_CONFIG(${ARCADIA_ROOT}/infra/docs/.yfm)\nEND()',
        );
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(ROOT, 'infra/docs/.yfm'));
    });

    it('resolves ${CURDIR} in DOCS_CONFIG', () => {
        writeFileSync(yamakePath, 'DOCS(html)\nDOCS_CONFIG(${CURDIR}/custom.config)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBe(join(dir, 'custom.config'));
    });

    it('ignores commented-out DOCS_CONFIG', () => {
        writeFileSync(yamakePath, '# DOCS_CONFIG(.yfm)\nDOCS(html)\nEND()');
        const result = parseYaMake(yamakePath, ROOT);
        expect(result.docsConfig).toBeUndefined();
    });
});

describe('resolveTarget', () => {
    const assembled = join('/', 'out', 'assembled');

    it('maps file inside docsDir', () => {
        const docsDir = join(ROOT, 'docs/common');
        const parsed = makeParsed({docsDir});
        const result = resolveTarget(join(docsDir, 'ru/index.md'), parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/index.md'));
    });

    it('maps DOCS_COPY_FILES file to its namespace', () => {
        const from = join(ROOT, 'devops/ru');
        const parsed = makeParsed({
            copyFiles: [{from, namespace: 'ru', files: ['feedback.md']}],
        });
        const result = resolveTarget(join(from, 'feedback.md'), parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/feedback.md'));
    });

    it('maps DOCS_INCLUDE_SOURCES file preserving arcadia-relative path', () => {
        const src = join(ROOT, 'src/lib/api.go');
        const parsed = makeParsed({includeSources: [src]});
        const result = resolveTarget(src, parsed, assembled);
        expect(result).toBe(join(assembled, 'src/lib/api.go'));
    });

    it('ignores DOCS_COPY_FILES file not in files list', () => {
        const from = join(ROOT, 'devops/ru');
        const parsed = makeParsed({
            copyFiles: [{from, namespace: 'ru', files: ['feedback.md']}],
        });
        expect(resolveTarget(join(from, 'other.md'), parsed, assembled)).toBeNull();
    });

    it('maps PEERDIR file to assembledDir root', () => {
        const peerDir = join(ROOT, 'docs/shared');
        const parsed = makeParsed({peerDirs: [peerDir]});
        const result = resolveTarget(join(peerDir, 'ru/index.md'), parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/index.md'));
    });

    it('maps COPY_FILE src to its declared dst', () => {
        const src = join(ROOT, 'assets/logo.png');
        const parsed = makeParsed({
            copyFileSingle: [{src, dst: 'ru/logo.png'}],
        });
        const result = resolveTarget(src, parsed, assembled);
        expect(result).toBe(join(assembled, 'ru/logo.png'));
    });

    it('maps DOCS_CONFIG path to .yfm in assembledDir', () => {
        const configPath = join(ROOT, 'project/docs/config.yml');
        const parsed = makeParsed({docsConfig: configPath});
        const result = resolveTarget(configPath, parsed, assembled);
        expect(result).toBe(join(assembled, '.yfm'));
    });

    it('returns null for unrelated path', () => {
        expect(
            resolveTarget(join('/', 'unrelated', 'file.md'), makeParsed(), assembled),
        ).toBeNull();
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

    it('copies DOCS_CONFIG file as .yfm to assembledDir', async () => {
        mkdirSync(join(tmp, 'conf'));
        writeFileSync(join(tmp, 'conf/config.yml'), 'title: Custom');

        const out = join(tmp, 'out');
        await assembleDir(out, tmp, makeParsed({docsConfig: join(tmp, 'conf/config.yml')}));

        expect(readFileSync(join(out, '.yfm'), 'utf8')).toBe('title: Custom');
    });

    it('prefers DOCS_CONFIG over default .yfm from originalInput', async () => {
        writeFileSync(join(tmp, '.yfm'), 'from: default');
        writeFileSync(join(tmp, 'custom.config'), 'from: custom');

        const out = join(tmp, 'out');
        await assembleDir(out, tmp, makeParsed({docsConfig: join(tmp, 'custom.config')}));

        expect(readFileSync(join(out, '.yfm'), 'utf8')).toBe('from: custom');
    });

    it('skips missing files without error', async () => {
        const out = join(tmp, 'out');
        const parsed = makeParsed({
            copyFiles: [{from: '/nonexistent', namespace: 'ru', files: ['missing.md']}],
        });

        await assembleDir(out, tmp, parsed);

        expect(existsSync(join(out, 'ru/missing.md'))).toBe(false);
    });

    it('merges PEERDIR contents into assembledDir root', async () => {
        const peerDir = join(tmp, 'peer');
        mkdirSync(join(peerDir, 'ru'), {recursive: true});
        writeFileSync(join(peerDir, 'ru/shared.md'), 'shared');

        const out = join(tmp, 'out');
        await assembleDir(out, tmp, makeParsed({peerDirs: [peerDir]}));

        expect(readFileSync(join(out, 'ru/shared.md'), 'utf8')).toBe('shared');
    });

    it('copies COPY_FILE to declared destination', async () => {
        mkdirSync(join(tmp, 'assets'));
        writeFileSync(join(tmp, 'assets/logo.png'), 'png');

        const out = join(tmp, 'out');
        const parsed = makeParsed({
            copyFileSingle: [{src: join(tmp, 'assets/logo.png'), dst: 'ru/logo.png'}],
        });

        await assembleDir(out, tmp, parsed);

        expect(readFileSync(join(out, 'ru/logo.png'), 'utf8')).toBe('png');
    });

    it('recreates assembledDir on each call', async () => {
        const out = join(tmp, 'out');
        mkdirSync(out);
        writeFileSync(join(out, 'stale.md'), 'stale');

        await assembleDir(out, tmp, makeParsed());

        expect(existsSync(join(out, 'stale.md'))).toBe(false);
    });
});
