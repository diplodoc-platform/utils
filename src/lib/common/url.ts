/**
 * Lightweight, dependency-free replacement for the deprecated Node.js
 * `url.parse()` / `url.format()` API, intended for parsing and re-assembling
 * relative document links (e.g. `foo/bar.md#anchor`, `../x.md?q=1`, `#anchor`).
 *
 * Unlike the WHATWG `URL` API, this helper does not require (and does not
 * assume) an absolute base, does not normalize `../`/`./` segments and does
 * not percent-encode the pathname — all of which would corrupt relative
 * document paths used across the Diplodoc platform.
 */
export type ParsedHref = {
    pathname: string | null;
    search: string | null;
    hash: string | null;
};

/**
 * Parses a relative href into `pathname`, `search` and `hash` parts.
 *
 * Empty `pathname` is represented as `null` (not an empty string), matching
 * the historical `url.parse()` behavior relied upon across the codebase.
 */
export function parseHref(href: string): ParsedHref {
    const [beforeHash, ...hashParts] = href.split('#');
    const hash = hashParts.length ? '#' + hashParts.join('#') : null;

    const queryIndex = beforeHash.indexOf('?');
    const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
    const search = queryIndex === -1 ? null : beforeHash.slice(queryIndex);

    return {
        pathname: path === '' ? null : path,
        search,
        hash,
    };
}

/**
 * Serializes a `ParsedHref` back into a href string.
 * Inverse of `parseHref` for relative document links.
 */
export function formatHref({pathname, search, hash}: Partial<ParsedHref>): string {
    return (pathname || '') + (search || '') + (hash || '');
}
