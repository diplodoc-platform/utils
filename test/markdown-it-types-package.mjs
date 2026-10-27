import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const temporaryRoot = mkdtempSync(join(tmpdir(), 'diplodoc-utils-parser-types-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = {...process.env, npm_config_cache: join(temporaryRoot, 'cache')};
const nodeTypesVersion = JSON.parse(
    readFileSync(require.resolve('@types/node/package.json')),
).version;

const consumerBody = `
import assert from 'node:assert/strict';

const {AttrsParser, parseMdAttrs} = utils;

const md = new MarkdownIt();
const source = '{#diagram .wide data-label="Hello world"}';
assert.deepEqual(parseMdAttrs(md, source, 0, source.length)?.attrs, {
    id: ['diagram'], class: ['wide'], 'data-label': ['Hello world'],
});
const token = md.parse('Content', {})[0];
assert.ok(token);
new AttrsParser('{#diagram .wide data-enabled}').apply(token);
assert.equal(token.attrGet('id'), 'diagram');
assert.equal(token.attrGet('class'), 'wide');
assert.equal(token.attrGet('data-enabled'), 'true');

function rejectInvalidInputs() {
    // @ts-expect-error The public token contract must not become untyped.
    new AttrsParser().apply({});
    // @ts-expect-error The parser helper contract must not become untyped.
    parseMdAttrs({helpers: {}}, source, 0, source.length);
}
void rejectInvalidInputs;
`;

let completed = false;
try {
    execFileSync(npm, ['run', 'build'], {cwd: projectRoot, env, stdio: 'inherit'});
    const [packed] = JSON.parse(
        execFileSync(
            npm,
            ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryRoot],
            {cwd: projectRoot, env, encoding: 'utf8'},
        ),
    );
    const tarball = join(temporaryRoot, packed.filename);

    for (const version of ['13.0.2', '15.0.3']) {
        const consumerRoot = join(temporaryRoot, `markdown-it-${version}`);
        mkdirSync(consumerRoot);
        const dependencies = {
            '@diplodoc/utils': `file:${tarball}`,
            'markdown-it': version,
            '@types/node': nodeTypesVersion,
            ...(version.startsWith('13.') ? {'@types/markdown-it': '13.0.9'} : {}),
        };
        writeFileSync(
            join(consumerRoot, 'package.json'),
            JSON.stringify({private: true, dependencies}, null, 2),
        );
        execFileSync(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
            cwd: consumerRoot,
            env,
            stdio: 'inherit',
        });
        const installedVersion = JSON.parse(
            readFileSync(join(consumerRoot, 'node_modules/markdown-it/package.json')),
        ).version;
        assert.equal(installedVersion, version);
        if (version.startsWith('15.')) {
            assert.equal(existsSync(join(consumerRoot, 'node_modules/@types/markdown-it')), false);
        }

        writeFileSync(
            join(consumerRoot, 'consumer.cts'),
            `import type MarkdownItConstructor from 'markdown-it' with {'resolution-mode': 'import'};
import utils = require('@diplodoc/utils');
const MarkdownIt: typeof MarkdownItConstructor = require('markdown-it');
${consumerBody}`,
        );
        writeFileSync(
            join(consumerRoot, 'consumer.mts'),
            `import MarkdownIt from 'markdown-it';
import utils from '@diplodoc/utils';
${consumerBody}`,
        );
        writeFileSync(
            join(consumerRoot, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    strict: true,
                    skipLibCheck: false,
                    esModuleInterop: true,
                    target: 'ES2022',
                    module: 'Node16',
                    moduleResolution: 'Node16',
                    types: ['node'],
                    outDir: './compiled',
                },
                files: ['consumer.cts', 'consumer.mts'],
            }),
        );
        execFileSync(
            process.execPath,
            [require.resolve('typescript/bin/tsc'), '-p', consumerRoot],
            {
                cwd: consumerRoot,
                stdio: 'inherit',
            },
        );
        for (const extension of ['cjs', 'mjs']) {
            execFileSync(process.execPath, [join(consumerRoot, `compiled/consumer.${extension}`)], {
                cwd: consumerRoot,
                stdio: 'inherit',
            });
        }
        // eslint-disable-next-line no-console
        console.log(`Markdown-it ${version}: strict .cts/.mts declarations and runtime passed.`);
    }
    completed = true;
} finally {
    if (completed) {
        rmSync(temporaryRoot, {recursive: true, force: true});
    } else {
        // eslint-disable-next-line no-console
        console.error(`Failed consumer fixtures retained at ${temporaryRoot}`);
    }
}
