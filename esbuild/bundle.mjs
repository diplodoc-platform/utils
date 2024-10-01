import {build} from 'esbuild';
import {TsconfigPathsPlugin} from '@esbuild-plugins/tsconfig-paths';
import {nodeExternalsPlugin} from 'esbuild-node-externals';

/** @type {import('esbuild').BuildOptions}*/
const commonConfig = {
    tsconfig: './tsconfig.json',
    entryPoints: ['src/lib/index.ts'],
    packages: 'external',
    platform: 'neutral',
    bundle: true,
    plugins: [
        // eslint-disable-next-line new-cap
        TsconfigPathsPlugin({tsconfig: './tsconfig.json'}),
        nodeExternalsPlugin(),
    ],
};

const esmConfig = {
    ...commonConfig,
    outdir: 'build/esm',
    format: 'esm',
};

const cjsConfig = {
    ...commonConfig,
    outdir: 'build/cjs',
    format: 'cjs',
};

Promise.all([esmConfig, cjsConfig].map(build));
