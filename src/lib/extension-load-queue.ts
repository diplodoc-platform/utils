/**
 * This file provides utilities for managing and processing load queues in a browser environment.
 *
 * It includes:
 * - A system for creating and managing load queues identified by unique symbols.
 * - A script store that holds callbacks associated with controllers.
 * - A React hook for using and managing controllers within a script store.
 *
 * Example usage:
 *
 * const MY_QUEUE_SYMBOL = Symbol.for('my-queue');
 * const MY_STORE_SYMBOL = Symbol.for('my-controllers-store');
 *
 * const myStore = getScriptStore(MY_STORE_SYMBOL);
 *
 * createLoadQueue({
 *   store: myStore,
 *   createController: () => new MyController(),
 *   queueKey: MY_QUEUE_SYMBOL,
 * });
 *
 * const controller = useController(myStore);
 */

import {useEffect, useState} from 'react';

import {isBrowser} from './browser';

export type ControllerLoadedCallback<T> = (controller: T) => void;

export const QUEUES_SYMBOL = Symbol.for('extension-load-queues');
export const SINGLE_QUEUE_SYMBOL = Symbol.for('single-queue');

export type ScriptStore<T> = ControllerLoadedCallback<T>[];

/**
 * Interface for creating a load queue.
 */
export interface CreateLoadQueueArgs<T> {
    // The store where callbacks are saved
    store: ScriptStore<T>;

    // Function that creates a controller
    createController: () => T;

    // Flag to check if the queue is already created
    isQueueCreated?: boolean;

    // Callback to handle queue creation
    onQueueCreated?: (created: boolean) => void;

    // Symbol key for identifying the queue
    queueKey?: symbol;
}

/**
 * Retrieves or initializes a script store for the given symbol key.
 *
 * @param {symbol} storeKey - The key associated with the script store.
 * @returns {ScriptStore<T>} The script store associated with the given key.
 */
export const getScriptStore = <T>(storeKey: symbol): ScriptStore<T> => {
    if (isBrowser()) {
        // Initialize the store if it does not exist or check that it is an array
        if (!window[storeKey]) {
            window[storeKey] = [];
        } else if (!Array.isArray(window[storeKey])) {
            throw new Error(`Expected window[${String(storeKey)}] to be an array`);
        }

        return window[storeKey] as ScriptStore<T>;
    } else {
        throw new Error('This functionality should be employed on the client-side.');
    }
};

/**
 * Ensures that the queues are initialized as an object in the global window.
 *
 * @returns {void}
 */
const ensureQueuesSymbolInitialized = (): void => {
    if (isBrowser()) {
        if (typeof window[QUEUES_SYMBOL] !== 'object' || window[QUEUES_SYMBOL] === null) {
            window[QUEUES_SYMBOL] = {};
        }
    } else {
        throw new Error('This functionality should be employed on the client-side.');
    }
};

/**
 * Retrieves the status of whether the queue associated with the queueKey is created.
 *
 * @param {symbol} queueKey - The key associated with the queue.
 * @returns {boolean} Whether the queue is created.
 */
export const getQueueStore = (queueKey: symbol): boolean => {
    ensureQueuesSymbolInitialized();
    return window[QUEUES_SYMBOL]?.[queueKey] || false;
};

/**
 * Returns a function to mark the queue as created for a given queueKey.
 *
 * @param {symbol} queueKey - The key associated with the queue.
 * @returns {function(boolean): void} A function that takes a boolean `created`
 * and marks the queue as created.
 */
export const createHandleQueueCreated = (queueKey: symbol): ((created: boolean) => void) => {
    ensureQueuesSymbolInitialized();
    return (created: boolean) => {
        window[QUEUES_SYMBOL][queueKey] = created;
    };
};

/**
 * Creates and manages a load queue.
 *
 * @param {CreateLoadQueueArgs<T>} args - The arguments required to create a load queue.
 * @returns {void}
 */
export const createLoadQueue = <T>({
    store,
    createController,
    queueKey = SINGLE_QUEUE_SYMBOL,
    isQueueCreated = getQueueStore(queueKey),
    onQueueCreated = createHandleQueueCreated(queueKey),
}: CreateLoadQueueArgs<T>): void => {
    if (!store || isQueueCreated) {
        return;
    }

    // Mark the queue as created
    onQueueCreated(true);

    const controller = createController();

    const queue = store.splice(0, store.length);

    // Override the store.push method to add callbacks to the queue and start processing
    store.push = function (...args) {
        args.forEach((callback) => {
            queue.push(callback);

            // Start processing the queue
            unqueue();
        });

        return queue.length;
    };

    let processing = false;

    // Function to start processing the next callback in the queue
    function unqueue() {
        if (!processing) {
            next();
        }
    }

    // Function to process callbacks in the queue one by one
    async function next(): Promise<void> {
        processing = true;

        const callback = queue.shift();
        if (callback) {
            await callback(controller);
            return next();
        }

        // Mark the processing as complete
        processing = false;
    }

    // Start the queue processing
    unqueue();
};

/**
 * A no-operation function used as a default cleanup function.
 *
 * @returns {void}
 */
const noop = (): void => {};

/**
 * React hook to manage and use a controller with a script store.
 *
 * @param {ScriptStore<T>} store - The store where the controller is managed.
 * @returns {T | null} The current controller or null if not available.
 */
export function useController<T>(store: ScriptStore<T>): T | null {
    const [controller, setController] = useState<T | null>(null);

    useEffect(() => {
        if (store) {
            store.push(setController); // Add setController to the store

            return () => {
                const index = store.indexOf(setController);
                if (index > -1) {
                    // Remove setController when unmounting
                    store.splice(index, 1);
                }
            };
        } else {
            // eslint-disable-next-line no-console
            console.warn('Store is not provided to useController'); // Replace console.warn with a logging function if necessary
        }

        return noop;
    }, []);

    return controller;
}

declare global {
    interface Window {
        [key: symbol]: ScriptStore<unknown>;
        [QUEUES_SYMBOL]: Record<symbol, boolean>;
    }
}
