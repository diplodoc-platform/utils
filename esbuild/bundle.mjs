import {build} from 'esbuild';
import {TsconfigPathsPlugin} from '@esbuild-plugins/tsconfig-paths';
import {nodeExternalsPlugin} from 'esbuild-node-externals';

/** @type {import('esbuild').BuildOptions}*/
const commonConfig = {
    tsconfig: './tsconfig.json',
    packages: 'external',
    platform: 'neutral',
    bundle: true,
    plugins: [
        // eslint-disable-next-line new-cap
        TsconfigPathsPlugin({tsconfig: './tsconfig.json'}),
        nodeExternalsPlugin(),
    ],
};

const esmConfig = (module) => ({
    ...commonConfig,
    entryPoints: [`src/lib/${module}/index.ts`],
    outdir: `build/esm/${module}`,
    format: 'esm',
});

const cjsConfig = (module) => ({
    ...commonConfig,
    entryPoints: [`src/lib/${module}/index.ts`],
    outdir: `build/cjs/${module}`,
    format: 'cjs',
});

const yaMakeConfig = (format) => ({
    ...commonConfig,
    platform: 'node',
    entryPoints: ['src/lib/ya-make/index.ts'],
    outdir: `build/${format}/ya-make`,
    format,
});

Promise.all(
    [
        esmConfig(['common']),
        esmConfig(['react']),
        cjsConfig(['common']),
        cjsConfig(['react']),
        yaMakeConfig('esm'),
        yaMakeConfig('cjs'),
    ].map(build),
);
