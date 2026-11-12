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
    // Keep the legacy root host on Markdown-it 13 and give the modern owner its own native 15 host.
    const modernRoot = join(temporaryRoot, 'modern-owner');
    mkdirSync(modernRoot);
    writeFileSync(
        join(modernRoot, 'package.json'),
        JSON.stringify({
            name: 'modern-utils-owner',
            version: '1.0.0',
            main: 'index.js',
            types: 'index.d.ts',
            dependencies: {
                '@diplodoc/utils': `file:${tarball}`,
                'markdown-it': '15.0.3',
            },
        }),
    );
    writeFileSync(
        join(modernRoot, 'index.js'),
        "const utils = require('@diplodoc/utils');\n" +
            'exports.getScriptStore = utils.getScriptStore;\n' +
            'exports.getQueueStore = utils.getQueueStore;\n' +
            'exports.createLoadQueue = utils.createLoadQueue;\n',
    );
    writeFileSync(join(modernRoot, 'index.d.ts'), "export * from '@diplodoc/utils';\n");
    const [modernPack] = JSON.parse(
        execFileSync(npm, ['pack', '--json', '--pack-destination', temporaryRoot], {
            cwd: modernRoot,
            env,
            encoding: 'utf8',
        }),
    );
    const mixedRoot = join(temporaryRoot, 'mixed-majors');
    mkdirSync(mixedRoot);
    writeFileSync(
        join(mixedRoot, 'package.json'),
        JSON.stringify({
            private: true,
            dependencies: {
                '@diplodoc/utils': '2.3.6',
                'markdown-it': '13.0.2',
                '@types/markdown-it': '13.0.9',
                'modern-utils-owner': `file:${join(temporaryRoot, modernPack.filename)}`,
                '@types/node': nodeTypesVersion,
            },
        }),
    );
    execFileSync(npm, ['install', '--no-audit', '--no-fund'], {
        cwd: mixedRoot,
        env,
        stdio: 'inherit',
    });
    const mixedRequire = createRequire(join(mixedRoot, 'package.json'));
    const modernRequire = createRequire(mixedRequire.resolve('modern-utils-owner'));
    const oldUtils = JSON.parse(
        readFileSync(
            join(dirname(mixedRequire.resolve('@diplodoc/utils')), '../../../package.json'),
        ),
    );
    const modernUtils = JSON.parse(
        readFileSync(
            join(dirname(modernRequire.resolve('@diplodoc/utils')), '../../../package.json'),
        ),
    );
    assert.equal(oldUtils.version, '2.3.6');
    assert.equal(
        modernUtils.version,
        JSON.parse(readFileSync(join(projectRoot, 'package.json'))).version,
    );
    assert.equal(modernRequire('markdown-it/package.json').version, '15.0.3');
    assert.equal(mixedRequire('markdown-it/package.json').version, '13.0.2');
    const mixedBody = `import assert from 'node:assert/strict';
import * as modern from 'modern-utils-owner';
import legacy from '@diplodoc/utils';
type Store = ReturnType<typeof modern.getScriptStore<{id: number}>>;
type LegacyStore = ReturnType<typeof legacy.getScriptStore<{id: number}>>;
const compatibleStores = (store: Store): LegacyStore => store;
Object.defineProperty(globalThis, 'window', {value: {document: {}}, configurable: true});
const key = Symbol.for('mixed-utils-consumer');
const store = modern.getScriptStore<{id: number}>(key);
assert.equal(compatibleStores(store), legacy.getScriptStore<{id: number}>(key));
const seen: number[] = [];
store.push(controller => { seen.push(controller.id); });
const queueKey = Symbol.for('mixed-utils-queue');
modern.createLoadQueue({store, queueKey, createController: () => ({id: 42})});
assert.equal(legacy.getQueueStore(queueKey), true);
assert.deepEqual(seen, [42]);
function rejectInvalidPayload() {
    // @ts-expect-error Store callbacks preserve their payload type across versions.
    store.push((controller: {invalid: boolean}) => { void controller; });
}
void rejectInvalidPayload;
`;
    for (const extension of ['cts', 'mts']) {
        writeFileSync(
            join(mixedRoot, `consumer.${extension}`),
            extension === 'cts'
                ? mixedBody.replace(
                      "import legacy from '@diplodoc/utils';",
                      "import legacy = require('@diplodoc/utils');",
                  )
                : mixedBody,
        );
    }
    writeFileSync(
        join(mixedRoot, 'tsconfig.json'),
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
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', mixedRoot], {
        cwd: mixedRoot,
        stdio: 'inherit',
    });
    for (const extension of ['cjs', 'mjs']) {
        execFileSync(process.execPath, [join(mixedRoot, `compiled/consumer.${extension}`)], {
            cwd: mixedRoot,
            stdio: 'inherit',
        });
    }
    // eslint-disable-next-line no-console
    console.log(
        'Mixed Utils 2/3 with native Markdown-it 13/15: strict .cts/.mts and shared queue passed.',
    );
    completed = true;
} finally {
    if (completed) {
        rmSync(temporaryRoot, {recursive: true, force: true});
    } else {
        // eslint-disable-next-line no-console
        console.error(`Failed consumer fixtures retained at ${temporaryRoot}`);
    }
}
