import type MarkdownIt from 'markdown-it';

// forked from https://github.com/hilookas/markdown-it-directive/blob/ebfb54ef1bf9174990dae74222bc6e0f574e2aa4/index.js#L104
// added support for attrs without value, for example: {data-is-active}

type MdIt = Pick<MarkdownIt, 'helpers' | 'utils'>;

export type ParseMdAttrsResult = {
    pos: number;
    attrs: Record<string, string[]>;
};

// eslint-disable-next-line complexity
export function parseMdAttrs(
    md: MdIt,
    src: string,
    pos: number,
    max: number,
): null | ParseMdAttrsResult {
    if (pos >= max) {
        return null;
    }
    if (src.charCodeAt(pos) !== 0x7b /* { */) {
        return null;
    }

    const attrs: Record<string, string[]> = {};
    ++pos;
    pos = skipBlanks(src, pos, max);
    for (; pos < max; pos = skipBlanks(src, pos, max)) {
        if (src.charCodeAt(pos) === 0x7d /* } */) {
            ++pos;

            return {pos, attrs};
        }

        const c = src.charCodeAt(pos);
        if (c === 0x23 /* # */) {
            // id
            ++pos;
            const rst = parseUnsurroundedName(src, pos, max);
            if (rst === null) {
                return null;
            }
            pos = rst.pos;
            const key = 'id',
                value = rst.name;
            if (typeof attrs[key] === 'undefined') {
                attrs[key] = [value];
            } else {
                attrs[key].push(value);
            }
        } else if (c === 0x2e /* . */) {
            // class
            ++pos;
            const rst = parseUnsurroundedName(src, pos, max);
            if (rst === null) {
                return null;
            }
            pos = rst.pos;
            // store
            const key = 'class',
                value = rst.name;
            if (typeof attrs[key] === 'undefined') {
                attrs[key] = [value];
            } else {
                attrs[key].push(value);
            }
        } else {
            // normal attrs
            // key
            let rst = parseAttrName(src, pos, max);
            if (rst === null) {
                return null;
            }
            const key = rst.name;
            pos = rst.pos;
            pos = skipBlanks(src, pos, max);
            if (pos >= max) {
                return null;
            }

            let value;

            // =
            if (src.charCodeAt(pos) === 0x3d /* = */) {
                ++pos;
                pos = skipBlanks(src, pos, max);

                if (pos >= max) {
                    return null;
                }

                const c = src.charCodeAt(pos);
                if (c === 0x22 /* " */ || c === 0x27 /* ' */) {
                    const rst = md.helpers.parseLinkTitle(src, pos, max);
                    if (!rst.ok) {
                        return null;
                    }
                    value = rst.str;
                    pos = rst.pos;
                } else {
                    rst = parseUnsurroundedName(src, pos, max);
                    if (rst === null) {
                        return null;
                    }
                    value = rst.name;
                    pos = rst.pos;
                }
            } else {
                // attr without value
                if (isBlank(src.charCodeAt(pos - 1))) {
                    --pos;
                }
                value = '';
            }

            if (typeof value !== 'undefined') {
                // store
                if (typeof attrs[key] === 'undefined') {
                    attrs[key] = [value];
                } else {
                    attrs[key].push(value);
                }
            }
        }

        // there must be a blank between attrs
        if (pos >= max) {
            return null;
        }
        const charBetween = src.charCodeAt(pos);
        if (!isBlank(charBetween) && charBetween !== 0x7d /* } */) {
            return null;
        }
    }

    return null;

    function isBlank(code: number): boolean {
        return md.utils.isSpace(code) || code === 0x0a;
    }

    function skipBlanks(src: string, pos: number, max: number): number {
        for (; pos < max; pos++) {
            const code = src.charCodeAt(pos);
            if (!isBlank(code)) {
                break;
            }
        }
        return pos;
    }
}

// follow spec from
// <https://www.w3.org/TR/xml/#sec-common-syn> (xml attr name)
// reason of not adapting non-ASCII characters are same as DIRECTIVE_NAME_RE's
const ATTR_NAME_RE = /^[a-z][a-z0-9\-_]*/;

function parseAttrName(src: string, pos: number, max: number) {
    // will return null when pos >= max
    const oldPos = pos;
    const rst = src.slice(pos, max).match(ATTR_NAME_RE);
    if (rst === null) {
        return null;
    }
    pos += rst[0].length;
    return {pos, name: src.slice(oldPos, pos)};
}

// base64 as minimum allowed chars
const UNSURROUNDED_STRING_RE = /^[a-z0-9\-_]+/i;

function parseUnsurroundedName(src: string, pos: number, max: number) {
    // will return null when pos >= max
    const oldPos = pos;
    const rst = src.slice(pos, max).match(UNSURROUNDED_STRING_RE);
    if (rst === null) {
        return null;
    }
    pos += rst[0].length;
    return {pos, name: src.slice(oldPos, pos)};
}
