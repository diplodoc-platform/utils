## Common rules and standards

This package is a submodule in the Diplodoc metapackage. When working in metapackage mode, also follow:

- `../../.agents/style-and-testing.md` — code style, import organization, testing, English-only docs/comments/commit messages
- `../../.agents/monorepo.md` — workspace vs standalone dependency management (`--no-workspaces`)
- `../../.agents/dev-infrastructure.md` — infrastructure update recipes and CI conventions
- `../../.agents/metapackage-requirements.md` — requirements for packages in the metapackage

## Project description

`@diplodoc/utils` provides shared utilities for the Diplodoc platform: AttrsParser (markdown-it-attrs–like), parseMdAttrs, and extension load queue (common + React).

## Structure

- `src/` — sources (`lib/common`, `lib/react`)
- `build/` — build output (generated, published)
- `esbuild/` — bundling (ESM + CJS for common and react)
- `test/` — test suite

## Development commands

```bash
npm run typecheck
npm test
npm run lint
npm run build
```
