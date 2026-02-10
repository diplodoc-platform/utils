import type {ParseMdAttrsResult} from '../src/lib/common/parse-md-attrs';

import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {parseMdAttrs} from '../src/lib/common/parse-md-attrs';

const md = new MarkdownIt('zero');

describe('parse markdown attributes', () => {
    it('should return null if no attrs', () => {
        const src = 'content';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toBeNull();
    });

    it('should return null if src has spaces before attrs', () => {
        const src = ' {}   content';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toBeNull();
    });

    it('should parse empty attrs', () => {
        const src = '{}   content';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 2,
            attrs: {},
        });
    });

    it('should parse attr without value', () => {
        const src = '{data-is-active}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 16,
            attrs: {'data-is-active': ['']},
        });
    });

    it('should parse attr with value', () => {
        const src = '{data-active=true}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 18,
            attrs: {'data-active': ['true']},
        });
    });

    it('should parse attr with value in quotation', () => {
        const src = "{data-line='1'}";
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 15,
            attrs: {'data-line': ['1']},
        });
    });

    it('should parse attr with value in quotation 2', () => {
        const src = '{data-line="2"}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 15,
            attrs: {'data-line': ['2']},
        });
    });

    it('should parse class name', () => {
        const src = '{.diplodoc}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 11,
            attrs: {class: ['diplodoc']},
        });
    });

    it('should parse id', () => {
        const src = '{#diplodoc}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 11,
            attrs: {id: ['diplodoc']},
        });
    });

    it('should skip attrs if max is reached', () => {
        const src = '{.class data-value="1"}';
        const result = parseMdAttrs(md, src, 0, 8);

        expect(result).toBeNull();
    });

    it('should parse several attrs', () => {
        const src = '{#img .image data-is-selected title=Image alt="Test image"}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 59,
            attrs: {
                id: ['img'],
                class: ['image'],
                title: ['Image'],
                alt: ['Test image'],
                'data-is-selected': [''],
            },
        });
    });

    it('should parse several identical attrs', () => {
        const src =
            '{#img0 .image1 title=Image2 data-is-selected #img3 .image4 title=Image5 data-is-selected}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 89,
            attrs: {
                id: ['img0', 'img3'],
                class: ['image1', 'image4'],
                title: ['Image2', 'Image5'],
                'data-is-selected': ['', ''],
            },
        });
    });

    it('should parse attrs between a lot of spaces', () => {
        const src = '{      #id   .class-name            data-entity-id=867  }';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 57,
            attrs: {
                id: ['id'],
                class: ['class-name'],
                'data-entity-id': ['867'],
            },
        });
    });

    it('should parse attrs with curly brackets in value', () => {
        const src = '{data-value="{{}}"}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 19,
            attrs: {
                'data-value': ['{{}}'],
            },
        });
    });

    it('should not parse attrs if brackets are not closed', () => {
        const src = '{data-line="123" _markdown_ *content*';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toBeNull();
    });

    it('should not parse attrs if open bracket is missing', () => {
        const src = 'data-line="123"}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toBeNull();
    });

    it('should not parse attrs if value is omitted', () => {
        const src = '{data-line= }';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toBeNull();
    });

    it('should parse attrs if value contains spaces', () => {
        const src = '{data-title="Title data-value="}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 32,
            attrs: {'data-title': ['Title data-value=']},
        });
    });

    it('should parse attrs if value contains only spaces', () => {
        const src = '{data-line="           "}';
        const result = parseMdAttrs(md, src, 0, src.length);

        expect(result).toStrictEqual<ParseMdAttrsResult>({
            pos: 25,
            attrs: {'data-line': ['           ']},
        });
    });

    // for show difference
    describe('AttrsParser tests', () => {
        it('parses classes and ids', () => {
            const src = '{.test .name #id #help}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                class: ['test', 'name'],
                id: ['id', 'help'],
            });
        });

        it('parses single key attrs', () => {
            const src = '{is-visible data-is-visible}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                'is-visible': [''],
                'data-is-visible': [''],
            });
        });

        it('parses wide mode', () => {
            const src = '{wide-view wide-name="short table"}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                'wide-view': [''],
                'wide-name': ['short table'],
            });
        });

        it('parses full attrs', () => {
            const src = '{is-visible=true data-is-visible="true"}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                'is-visible': ['true'],
                'data-is-visible': ['true'],
            });
        });

        it('with not closed attrs', () => {
            const src = '{is-visible="true data-is-visible="}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                'is-visible': ['true data-is-visible='],
            });
        });

        it('with complex attrs', () => {
            const src =
                '{wide-content wide-name="very big name" with-extend="true" extendable=true name}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                'wide-content': [''],
                'wide-name': ['very big name'],
                'with-extend': ['true'],
                extendable: ['true'],
                name: [''],
            });
        });

        it('with all attrs', () => {
            const src =
                '{wide-content .name .id wide-name="very big name" with-extend="true" .hello-world extendable=true name #id}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                class: ['name', 'id', 'hello-world'],
                id: ['id'],
                name: [''],
                'wide-content': [''],
                'wide-name': ['very big name'],
                'with-extend': ['true'],
                extendable: ['true'],
            });
        });

        it('with curly attrs', () => {
            const src =
                '{wide-content .name .id wide-name="very {{big}} name" with-extend="true" .hello-world extendable=true name #id}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                class: ['name', 'id', 'hello-world'],
                id: ['id'],
                name: [''],
                'wide-content': [''],
                'wide-name': ['very {{big}} name'],
                'with-extend': ['true'],
                extendable: ['true'],
            });
        });

        it('should not touch includes', () => {
            const src = '{% include <a href="./mocks/include.md">create-folder</a> %}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result).toBeNull();
        });

        it.skip('should return id', () => {
            const src = '{invalid= #valid-id}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                id: ['valid-id'],
                invalid: [' '],
            });
        });

        it('should return id with " and spaces', () => {
            const src = '{invalid="          " #valid-id}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                id: ['valid-id'],
                invalid: ['          '],
            });
        });

        it.skip('should return class with dots', () => {
            const src = '{.name.lastname.test}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                class: ['name.lastname.test'],
            });
        });

        it.skip('should return url', () => {
            const src = '{url=/test/route data-url="/route/test"}';
            const result = parseMdAttrs(md, src, 0, src.length);

            expect(result?.attrs).toEqual({
                url: ['/test/route'],
                'data-url': ['/route/test'],
            });
        });
    });
});
