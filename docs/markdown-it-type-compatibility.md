# Markdown-it declaration compatibility

Utils requires Markdown-it 15 as a peer dependency. Install `markdown-it@^15.0.3`
alongside Utils. The parser's own declarations provide the types for
`AttrsParser.apply` and `parseMdAttrs`. Other packages in the application can
still have their own Markdown-it 13 and `@types/markdown-it` dependencies.

The internal `markdown-it-types` module imports the public constructor in import
resolution mode, derives its instance with `InstanceType`, and derives tokens from
the return type of `parse`. This is a type-only import, so Utils does not load a
parser at runtime. It also avoids the unexported `markdown-it/lib/token` path and
Markdown-it 15's CommonJS declaration shim.

Run the installed-package regression with:

```sh
npm run test:package
```

It builds and packs Utils, then installs it with strict peer checks in a fresh
pnpm consumer. The consumer uses Markdown-it 15.0.3 and a separate dependency
uses Markdown-it 13.0.2 and `@types/markdown-it` 13.0.9. The test compiles and
runs real `.cts` and `.mts` consumers with Node16 module resolution and
`skipLibCheck: false`. It also checks that Utils 2 and 3 share the runtime
queue when both are installed.

The explicit `resolution-mode` attribute requires syntax supported since
TypeScript 5.3. The installed-package test uses the repository's TypeScript
compiler. For Markdown-it 15 CommonJS consumers, a typed `require` selects
the import-mode constructor type:

```typescript
import type MarkdownItConstructor from 'markdown-it' with {'resolution-mode': 'import'};

const MarkdownIt: typeof MarkdownItConstructor = require('markdown-it');
```

Native `.mts` consumers use the ordinary Markdown-it default import.
