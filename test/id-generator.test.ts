import {describe, expect, it} from 'vitest';

import {createIDGenerator, createIDGeneratorByStrategy} from '../src/lib/common';

describe('createIDGenerator', () => {
    describe('with prefix', () => {
        it('returns prefix-1 on first call', () => {
            const generateID = createIDGenerator();
            expect(generateID('term')).toBe('term-1');
        });

        it('increments counter on repeated calls with the same prefix', () => {
            const generateID = createIDGenerator();
            expect(generateID('term')).toBe('term-1');
            expect(generateID('term')).toBe('term-2');
            expect(generateID('term')).toBe('term-3');
        });

        it('maintains independent counters for different prefixes', () => {
            const generateID = createIDGenerator();
            expect(generateID('term')).toBe('term-1');
            expect(generateID('inline-code')).toBe('inline-code-1');
            expect(generateID('term')).toBe('term-2');
            expect(generateID('inline-code')).toBe('inline-code-2');
        });
    });

    describe('without prefix', () => {
        it('returns a string when called with no arguments', () => {
            const generateID = createIDGenerator();
            const id = generateID();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('returns a string when called with undefined', () => {
            const generateID = createIDGenerator();
            const id = generateID(undefined);
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('returns unique values on each call without prefix', () => {
            const generateID = createIDGenerator();
            const ids = new Set(Array.from({length: 10}, () => generateID()));
            // Collision probability is negligible — all values should be unique
            expect(ids.size).toBe(10);
        });
    });

    describe('isolation between instances', () => {
        it('two generators have independent counters', () => {
            const gen1 = createIDGenerator();
            const gen2 = createIDGenerator();

            gen1('term');
            gen1('term');

            expect(gen1('term')).toBe('term-3');
            expect(gen2('term')).toBe('term-1');
        });

        it('counter resets when a new generator is created', () => {
            const gen1 = createIDGenerator();
            gen1('x');
            gen1('x');
            gen1('x');

            const gen2 = createIDGenerator();
            expect(gen2('x')).toBe('x-1');
        });
    });

    describe('IDGenerator type', () => {
        it('returned function accepts an optional string argument', () => {
            const generateID = createIDGenerator();
            expect(() => generateID()).not.toThrow();
            expect(() => generateID('prefix')).not.toThrow();
        });
    });
});

describe('createIDGeneratorByStrategy', () => {
    describe("strategy 'random'", () => {
        it('returns a function', () => {
            const generateID = createIDGeneratorByStrategy('random');
            expect(typeof generateID).toBe('function');
        });

        it('returns random strings when called without prefix', () => {
            const generateID = createIDGeneratorByStrategy('random');
            const ids = new Set(Array.from({length: 10}, () => generateID()));
            expect(ids.size).toBe(10);
        });

        it('returns prefixed random strings when called with prefix', () => {
            const generateID = createIDGeneratorByStrategy('random');
            const id = generateID();

            expect(id).toMatch(/[\w\d]{1,8}/);
        });
    });

    describe("strategy 'deterministic'", () => {
        it('returns a function', () => {
            const generateID = createIDGeneratorByStrategy('deterministic');
            expect(typeof generateID).toBe('function');
        });

        it('returns a counter-based generator (same as createIDGenerator)', () => {
            const generateID = createIDGeneratorByStrategy('deterministic')!;
            expect(generateID('tab')).toBe('tab-1');
            expect(generateID('tab')).toBe('tab-2');
            expect(generateID('section')).toBe('section-1');
        });

        it('creates a new isolated instance on each call', () => {
            const gen1 = createIDGeneratorByStrategy('deterministic')!;
            const gen2 = createIDGeneratorByStrategy('deterministic')!;

            gen1('x');
            gen1('x');

            expect(gen1('x')).toBe('x-3');
            expect(gen2('x')).toBe('x-1');
        });
    });

    describe("strategy 'constant'", () => {
        it('returns a function', () => {
            const generateID = createIDGeneratorByStrategy('constant');
            expect(typeof generateID).toBe('function');
        });

        it("always returns '1' regardless of prefix", () => {
            const generateID = createIDGeneratorByStrategy('constant')!;
            expect(generateID('tab')).toBe('1');
            expect(generateID('tab')).toBe('1');
            expect(generateID('section')).toBe('1');
            expect(generateID()).toBe('1');
        });
    });

    describe('default behavior', () => {
        it("uses 'random' strategy when called without arguments", () => {
            const generateID = createIDGeneratorByStrategy();
            const ids = new Set(Array.from({length: 10}, () => generateID()));
            expect(ids.size).toBe(10);
        });
    });

    describe('unknown strategy', () => {
        it('falls through to random generator for unrecognized strategy', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const generateID = createIDGeneratorByStrategy('unknown' as any);
            const id = generateID();

            expect(typeof generateID).toBe('function');
            expect(id).toMatch(/[\w\d]{1,8}/);
        });
    });
});
