import type {ScriptStore} from '../common';

import {useEffect, useState} from 'react';

/**
 * React hook to manage and use a controller with a script store.
 *
 * @param {ScriptStore<T>} store - The store where the controller is managed.
 * @returns {T | null} The current controller or null if not available.
 */
export function useController<T>(store: ScriptStore<T>): T | null {
    const [controller, setController] = useState<T | null>(null);

    useEffect(() => {
        store.push(setController); // Add setController to the store

        return () => {
            const index = store.indexOf(setController);
            if (index > -1) {
                // Remove setController when unmounting
                store.splice(index, 1);
            }
        };
    }, []);

    return controller;
}
