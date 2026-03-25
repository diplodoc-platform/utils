/**
 * Type for a per-file isolated ID generator function.
 * Use `createIDGenerator()` to create a new instance with its own counter.
 */
export type IDGenerator = (prefix?: string) => string;

/**
 * Creates an isolated ID generator with its own counter per prefix.
 * Call once per file/document to ensure IDs start from 1 for each file.
 *
 * @example
 * const generateID = createIDGenerator();
 * generateID('term')        // → 'term-1'
 * generateID('term')        // → 'term-2'
 * generateID('inline-code') // → 'inline-code-1'
 * generateID()              // → random 8-char string
 * @returns An isolated {@link IDGenerator} function with its own per-prefix counters.
 */
export function createIDGenerator(): IDGenerator {
    const counters: Map<string, number> = new Map();

    return function generateID(prefix?: string): string {
        if (!prefix) {
            return Math.random().toString(36).substr(2, 8);
        }

        counters.set(prefix, (counters.get(prefix) || 0) + 1);

        return `${prefix}-${counters.get(prefix)}`;
    };
}
