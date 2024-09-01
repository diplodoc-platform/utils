const {build} = require('esbuild');
const {TsconfigPathsPlugin} = require('@esbuild-plugins/tsconfig-paths');
const {nodeExternalsPlugin} = require('esbuild-node-externals');

const common = {
    bundle: true,
    sourcemap: true,
    tsconfig: './tsconfig.build.json',
};

build({
    entryPoints: ['src/lib/index.ts'],
    packages: 'external',
    outfile: 'lib/index.js',
    platform: 'node',
    target: 'node14',
    plugins: [
        // eslint-disable-next-line new-cap
        TsconfigPathsPlugin({tsconfig: './tsconfig.build.json'}),
        nodeExternalsPlugin(),
    ],
});

build({
    ...common,
    entryPoints: ['src/react/index.ts'],
    outfile: 'react/index.js',
    platform: 'neutral',
    external: ['react'],
    target: 'es6',
    format: 'cjs',
});
