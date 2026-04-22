/**
 * Type for a per-file isolated ID generator function.
 * Use `createIDGenerator()` to create a new instance with its own counter.
 */
export type IDGenerator = (prefix?: string) => string;

/**
 * Strategy for generating element IDs (tabs, terms, code blocks, etc.).
 * - `'random'` (default): uses `Math.random()` — legacy behavior, non-deterministic.
 * - `'deterministic'`: uses per-file counters with prefix (e.g. `'term-1'`).
 * - `'constant'`: always returns `'1'` — eliminates ID noise when diffing build outputs.
 */
export type IDGeneratorStrategy = 'random' | 'deterministic' | 'constant';

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

/**
 * Factory that creates an {@link IDGenerator} based on the chosen strategy.
 *
 * @param strategy - The ID generation strategy to use.
 * @returns An {@link IDGenerator} function for the selected strategy.
 *
 * @example
 * // In CLI or any consumer:
 * const generateID = createIDGeneratorByStrategy('deterministic');
 * // Pass to transform options — plugins will use it instead of random IDs
 *
 * @example
 * const generateID = createIDGeneratorByStrategy('random');
 * // Returns a generator with legacy random behavior
 */
export function createIDGeneratorByStrategy(strategy: IDGeneratorStrategy = 'random'): IDGenerator {
    switch (strategy) {
        case 'deterministic':
            return createIDGenerator();
        case 'constant':
            return () => '1';
        case 'random':
        default:
            return () => Math.random().toString(36).substr(2, 8);
    }
}
