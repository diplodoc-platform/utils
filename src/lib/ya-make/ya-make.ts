import {basename, dirname, join, relative, sep} from 'node:path';
import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync} from 'node:fs';
import {cp} from 'node:fs/promises';

export type CopyFileEntry = {
    from: string;
    namespace: string;
    files: string[];
};

export type CopyFileSingleEntry = {
    src: string;
    dst: string;
};

export type YaMakeParsed = {
    arcadiaRoot: string;
    docsDir?: string;
    copyFiles: CopyFileEntry[];
    includeSources: string[];
    peerDirs: string[];
    copyFileSingle: CopyFileSingleEntry[];
};

function resolveFrom(raw: string, arcadiaRoot: string, curDir: string): string {
    const stripped = raw.replace(/\/$/, '');

    if (stripped.startsWith('${ARCADIA_ROOT}')) {
        return join(arcadiaRoot, stripped.slice('${ARCADIA_ROOT}'.length));
    }

    if (stripped.startsWith('${CURDIR}')) {
        return join(curDir, stripped.slice('${CURDIR}'.length));
    }

    return stripped;
}

export function parseYaMake(yamakePath: string, arcadiaRoot: string): YaMakeParsed {
    const raw = readFileSync(yamakePath, 'utf8');
    const content = raw
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
    const curDir = dirname(yamakePath);

    const docsDirMatch = /DOCS_DIR\s*\(\s*([\w/.:-]+)\s*\)/.exec(content);
    const docsDir = docsDirMatch ? join(arcadiaRoot, docsDirMatch[1]) : undefined;

    const copyFiles: CopyFileEntry[] = [];
    const blockRegex = /DOCS_COPY_FILES\s*\(([\s\S]*?)\)/g;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(content)) !== null) {
        const block = match[1];
        const lineMatch = /FROM\s+(\S+)\s+NAMESPACE\s+(\S+)\s+([\s\S]+)/.exec(block);

        if (!lineMatch) {
            continue;
        }

        const from = resolveFrom(lineMatch[1], arcadiaRoot, curDir);
        const namespace = lineMatch[2];
        const files = lineMatch[3].trim().split(/\s+/).filter(Boolean);

        copyFiles.push({from, namespace, files});
    }

    const includeSources: string[] = [];
    const includeRegex = /DOCS_INCLUDE_SOURCES\s*\(([\s\S]*?)\)/g;

    while ((match = includeRegex.exec(content)) !== null) {
        const paths = match[1].trim().split(/\s+/).filter(Boolean);

        for (const p of paths) {
            includeSources.push(join(arcadiaRoot, p));
        }
    }

    const peerDirs: string[] = [];
    const peerDirRegex = /\bPEERDIR\s*\(([\s\S]*?)\)/g;

    while ((match = peerDirRegex.exec(content)) !== null) {
        const paths = match[1].trim().split(/\s+/).filter(Boolean);

        for (const p of paths) {
            peerDirs.push(join(arcadiaRoot, p));
        }
    }

    const copyFileSingle: CopyFileSingleEntry[] = [];
    const copyFileRegex = /\bCOPY_FILE\s*\(\s*(\S+)\s+(\S+)\s*\)/g;

    while ((match = copyFileRegex.exec(content)) !== null) {
        const rawSrc = match[1];
        const src = rawSrc.includes('${')
            ? resolveFrom(rawSrc, arcadiaRoot, curDir)
            : join(curDir, rawSrc);
        copyFileSingle.push({src, dst: match[2]});
    }

    return {arcadiaRoot, docsDir, copyFiles, includeSources, peerDirs, copyFileSingle};
}

export function resolveTarget(
    absPath: string,
    parsed: YaMakeParsed,
    assembledDir: string,
): string | null {
    if (parsed.docsDir && absPath.startsWith(parsed.docsDir + sep)) {
        return join(assembledDir, relative(parsed.docsDir, absPath));
    }

    const fileBase = basename(absPath);

    for (const {from, namespace, files} of parsed.copyFiles) {
        if (absPath.startsWith(from + sep) && files.includes(fileBase)) {
            return join(assembledDir, namespace, fileBase);
        }
    }

    if (parsed.includeSources.includes(absPath)) {
        return join(assembledDir, relative(parsed.arcadiaRoot, absPath));
    }

    for (const peerDir of parsed.peerDirs) {
        if (absPath.startsWith(peerDir + sep)) {
            return join(assembledDir, relative(peerDir, absPath));
        }
    }

    const copyFileSingleEntry = parsed.copyFileSingle.find((e) => e.src === absPath);
    if (copyFileSingleEntry) {
        return join(assembledDir, copyFileSingleEntry.dst);
    }

    return null;
}

function copyFileTo(src: string, dst: string): void {
    if (!existsSync(src)) {
        return;
    }

    mkdirSync(dirname(dst), {recursive: true});
    copyFileSync(src, dst);
}

export async function assembleDir(
    assembledDir: string,
    originalInput: string,
    parsed: YaMakeParsed,
): Promise<void> {
    rmSync(assembledDir, {recursive: true, force: true});
    mkdirSync(assembledDir, {recursive: true});

    if (parsed.docsDir && existsSync(parsed.docsDir)) {
        await cp(parsed.docsDir, assembledDir, {recursive: true});
    }

    for (const peerDir of parsed.peerDirs) {
        if (existsSync(peerDir)) {
            await cp(peerDir, assembledDir, {recursive: true});
        }
    }

    for (const {from, namespace, files} of parsed.copyFiles) {
        for (const file of files) {
            copyFileTo(join(from, file), join(assembledDir, namespace, file));
        }
    }

    for (const src of parsed.includeSources) {
        copyFileTo(src, join(assembledDir, relative(parsed.arcadiaRoot, src)));
    }

    for (const {src, dst} of parsed.copyFileSingle) {
        copyFileTo(src, join(assembledDir, dst));
    }

    copyFileTo(join(originalInput, '.yfm'), join(assembledDir, '.yfm'));
}
