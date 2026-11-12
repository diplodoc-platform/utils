import type MarkdownItConstructor from 'markdown-it' with {'resolution-mode': 'import'};

/** Use the public constructor across legacy @types and native Markdown-it declarations. */
export type MarkdownIt = InstanceType<typeof MarkdownItConstructor>;

/** Derive tokens from the public API instead of an unexported parser subpath. */
export type Token = ReturnType<MarkdownIt['parse']>[number];
