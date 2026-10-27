# Markdown-it declaration compatibility

The public `AttrsParser.apply` and `parseMdAttrs` signatures support Markdown-it
13 with `@types/markdown-it` and Markdown-it 15 with its native declarations.
Both signatures retain their existing contracts: a parser token for `apply`,
and the parser's `helpers` and `utils` for `parseMdAttrs`.

The internal `markdown-it-types` module imports the public constructor in import
resolution mode, derives its instance with `InstanceType`, and derives tokens from
the return type of `parse`. It introduces no runtime import or parser dependency.
This avoids the unexported `markdown-it/lib/token` path and prevents CommonJS
declarations from selecting Markdown-it 15's broken CommonJS declaration shim.
The same alias resolves the existing DefinitelyTyped declaration for version 13.

Run the installed-package regression with:

```sh
node test/markdown-it-types-package.mjs
```

It builds and packs utils, installs that tarball into isolated consumers for
Markdown-it 13.0.2 plus `@types/markdown-it` 13.0.9 and Markdown-it 15.0.3 without
that type package, then compiles actual `.cts` and `.mts` files with strict types,
Node16 module resolution and `skipLibCheck: false`. Both emitted consumers execute
`parseMdAttrs` and `AttrsParser.apply` with real parser instances and tokens.
Negative type assertions prevent accidentally weakening the public parameters.
The harness uses the repository's TypeScript compiler; this change was tested
with TypeScript 6.0.3. Failed fixtures are retained for diagnosis.

The explicit `resolution-mode` attribute requires syntax supported since
TypeScript 5.3; this does not claim that every transitive declaration supports
every TypeScript version from 5.3 onward. For Markdown-it 15 CommonJS consumers,
the fixture uses a typed `require` with an import-mode constructor type to avoid
the upstream shim issue:

```typescript
import type MarkdownItConstructor from 'markdown-it' with {'resolution-mode': 'import'};

const MarkdownIt: typeof MarkdownItConstructor = require('markdown-it');
```

Native `.mts` consumers use the ordinary parser default import and default-import
interop for utils' existing Node CommonJS export. This type-only fix does
not change utils' runtime or export conditions, upgrade its dependencies, or
claim to repair the upstream Markdown-it CommonJS declarations.
