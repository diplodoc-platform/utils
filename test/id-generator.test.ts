import {describe, expect, it} from 'vitest';

import {createIDGenerator} from '../src/lib/common';

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
