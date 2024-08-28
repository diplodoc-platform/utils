# Diplodoc utils

[![NPM version](https://img.shields.io/npm/v/@diplodoc/utils.svg?style=flat)](https://www.npmjs.org/package/@diplodoc/utils)

Diplodoc cross-packages utils.

## Motivation 

The Diplodoc ecosystem consists of many packages that have similar problems and needs. This package will contain all the general logic that is duplicated in our code base.

## Table of contents

- [AttrsParser](#AttrsParser)

### AttrsParser 

### Purpose

Support [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs)-like attributes parser. Used in custom Diplodoc MarkdownIt plugins to add classes and anchors, enabling subsequent customization through CSS.

### Interface 

```typescript
    /* 
        optional first query
        if provided parser will parse it immediately
        each 'parse' call is pure
    */
    const attrs = new AttrsParser('{.class #id data-name=diplodoc}');
    
    attrs.state /* { class: ['class'], id: ['id'], 'data-name': ['diplodoc'] } */

    const other = attrs.parse('{data-wide title="Support quotes too"}')

    other /* { attr: ['data-wide'], title: ['Support quotes too'] } */
```

