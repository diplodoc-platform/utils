# Changelog

## [2.2.4](https://github.com/diplodoc-platform/utils/compare/v2.2.3...v2.2.4) (2026-06-09)


### Bug Fixes

* **deps:** Update @diplodoc/quote-link-extension@0.1.5 ([7dc5f3c](https://github.com/diplodoc-platform/utils/commit/7dc5f3c16991e9681812b53a3eec0a144d8a1ce0))

## [2.2.3](https://github.com/diplodoc-platform/utils/compare/v2.2.2...v2.2.3) (2026-05-28)


### Bug Fixes

* **deps:** updated node to 24 ([ea0c165](https://github.com/diplodoc-platform/utils/commit/ea0c1656eb75bdaafb40cbaabe129f400928c832))

## [2.2.2](https://github.com/diplodoc-platform/utils/compare/v2.2.1...v2.2.2) (2026-04-22)


### Bug Fixes

* extend random mode in generator id ([ab87f0d](https://github.com/diplodoc-platform/utils/commit/ab87f0d5e49d426c6b6d148e8805b4cd6c93257a))

## [2.2.1](https://github.com/diplodoc-platform/utils/compare/v2.2.0...v2.2.1) (2026-04-22)


### Bug Fixes

* add generator strategy DOCSTOOLS-5561 ([c0a9a72](https://github.com/diplodoc-platform/utils/commit/c0a9a72a9d27320e7b657b40b9275de50029e6a5))

## [2.2.0](https://github.com/diplodoc-platform/utils/compare/v2.1.0...v2.2.0) (2026-03-26)


### Features

* Universal generateID method DOCSTOOLS-5561 ([f105a20](https://github.com/diplodoc-platform/utils/commit/f105a20020e5015a2117b336a8de31ace0a49f81))


### Bug Fixes

* Update infra to v1.13.2 ([30430cc](https://github.com/diplodoc-platform/utils/commit/30430ccdc8c4b917c95f47ddde2a4fd3e261afb6))

## [2.1.0](https://github.com/diplodoc-platform/utils/compare/v2.0.1...v2.1.0) (2025-03-21)


### Features

* added attributes parser for markdown-it plugins ([7f2bceb](https://github.com/diplodoc-platform/utils/commit/7f2bceb547edb63a2028a040eaccea63ab918fd2))
* allow react 19 in deps ([9fa3a2e](https://github.com/diplodoc-platform/utils/commit/9fa3a2e22a95ff692bec6485fc238175148053b9))

## [2.0.1](https://github.com/diplodoc-platform/utils/compare/v2.0.0...v2.0.1) (2025-01-29)


### Bug Fixes

* add types to exports ([2b2d0dd](https://github.com/diplodoc-platform/utils/commit/2b2d0dd3b3ad901cc955aa0ab26eaf2c63f5801a))

## [2.0.0](https://github.com/diplodoc-platform/utils/compare/v1.2.1...v2.0.0) (2025-01-29)

### ⚠ BREAKING CHANGES

- Extract react utils to isolated lib.
  In the latest major release, we've reorganized our libraries for better modularity.
  Now, to import the useController function, you should use `import { useController } from '@diplodoc/utils/react';` instead of the previous `import { useController } from '@diplodoc/utils';`.

### Features

- Extract react utils to isolated lib ([ca70b94](https://github.com/diplodoc-platform/utils/commit/ca70b94a08129b017086bb7bae247ce80403e1b3))

## [1.2.1](https://github.com/diplodoc-platform/utils/compare/v1.2.0...v1.2.1) (2024-10-01)

### Bug Fixes

- types field ([a459a9e](https://github.com/diplodoc-platform/utils/commit/a459a9e372e051d8e9e31d0ba6ece754cb8ab51a))

## [1.2.0](https://github.com/diplodoc-platform/utils/compare/v1.1.0...v1.2.0) (2024-10-01)

### Features

- added extension-load-queue ([d1a6905](https://github.com/diplodoc-platform/utils/commit/d1a69051c9d82c0ddbce0a9530437329a1210a86))
- support cjs ([55c4065](https://github.com/diplodoc-platform/utils/commit/55c4065c4625f065f7bef014b1007e7c53c94af8))

## [1.1.0](https://github.com/diplodoc-platform/utils/compare/v1.0.0...v1.1.0) (2024-09-26)

### Features

- added extension-load-queue ([d1a6905](https://github.com/diplodoc-platform/utils/commit/d1a69051c9d82c0ddbce0a9530437329a1210a86))
- added TODO ([f790e6a](https://github.com/diplodoc-platform/utils/commit/f790e6aaf9ba9c3fb17f36e813939340f53af06a))
- change tsconfig ([b9b0721](https://github.com/diplodoc-platform/utils/commit/b9b07211f2f7b6a27edadd80ca2ea1d7ad1d676a))
- updated build and types ([69ef8ff](https://github.com/diplodoc-platform/utils/commit/69ef8ffb4066fdda2667377a47bdf88cc15727f9))

### Bug Fixes

- **extension-load-queue:** fixed export ([3c56969](https://github.com/diplodoc-platform/utils/commit/3c5696976347d92108351704c70d208877b7b46e))
- **extension-load-queue:** fixed export ([55c913e](https://github.com/diplodoc-platform/utils/commit/55c913ee02f0825a41be905af9a232d21b98ac64))
- **extension-load-queue:** fixed TODO, added multi queues logic, added comments ([f47d866](https://github.com/diplodoc-platform/utils/commit/f47d866203173df4fbc431f0f325756083823145))
- linter ([2b16c9c](https://github.com/diplodoc-platform/utils/commit/2b16c9c9a2089de994386bb11aed3ca830438803))

## 1.0.0 (2024-08-29)

### Features

- init utils ([f4297b4](https://github.com/diplodoc-platform/utils/commit/f4297b45661521a0e76db18b1497f2a45cf42e91))
- init utils package ([9a91670](https://github.com/diplodoc-platform/utils/commit/9a91670900339397658379e5d73319cfeb2673c5))
