import {coverageConfigDefaults, defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
        exclude: ['**/node_modules/**', 'build', 'dist', 'coverage'],
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            exclude: [
                'test/**',
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                ...coverageConfigDefaults.exclude,
            ],
            reporter: ['text', 'json', 'html', 'lcov'],
        },
    },
});
