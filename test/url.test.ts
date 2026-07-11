import {describe, expect, it} from 'vitest';

import {formatHref, parseHref} from '../src/lib/common/url';

describe('parseHref', () => {
    it('parses a plain pathname', () => {
        expect(parseHref('foo/bar.md')).toEqual({
            pathname: 'foo/bar.md',
            search: null,
            hash: null,
        });
    });

    it('parses pathname with hash', () => {
        expect(parseHref('foo/bar.md#a')).toEqual({
            pathname: 'foo/bar.md',
            search: null,
            hash: '#a',
        });
    });

    it('parses pathname with query and hash', () => {
        expect(parseHref('foo?x=1#a')).toEqual({
            pathname: 'foo',
            search: '?x=1',
            hash: '#a',
        });
    });

    it('parses hash-only href', () => {
        expect(parseHref('#a')).toEqual({
            pathname: null,
            search: null,
            hash: '#a',
        });
    });

    it('parses empty href', () => {
        expect(parseHref('')).toEqual({
            pathname: null,
            search: null,
            hash: null,
        });
    });

    it('parses query-only href', () => {
        expect(parseHref('?x=1')).toEqual({
            pathname: null,
            search: '?x=1',
            hash: null,
        });
    });

    it('keeps extra hash characters (# inside fragment) attached to hash', () => {
        expect(parseHref('foo.md#a#b')).toEqual({
            pathname: 'foo.md',
            search: null,
            hash: '#a#b',
        });
    });
});

describe('formatHref', () => {
    it('formats pathname only', () => {
        expect(formatHref({pathname: 'foo/bar.md', search: null, hash: null})).toBe('foo/bar.md');
    });

    it('formats pathname with hash', () => {
        expect(formatHref({pathname: 'foo/bar.md', search: null, hash: '#a'})).toBe('foo/bar.md#a');
    });

    it('formats pathname with search and hash', () => {
        expect(formatHref({pathname: 'foo', search: '?x=1', hash: '#a'})).toBe('foo?x=1#a');
    });

    it('formats hash-only', () => {
        expect(formatHref({pathname: null, search: null, hash: '#a'})).toBe('#a');
    });

    it('formats empty object as empty string', () => {
        expect(formatHref({pathname: null, search: null, hash: null})).toBe('');
    });
});

describe('parseHref / formatHref round-trip', () => {
    const cases = [
        'foo/bar.md',
        'foo/bar.md#a',
        'foo?x=1#a',
        '#a',
        '',
        '?x=1',
        '../folder/file.md',
        './file.md?x=1',
    ];

    it.each(cases)('round-trips %s', (href) => {
        expect(formatHref(parseHref(href))).toBe(href);
    });
});
