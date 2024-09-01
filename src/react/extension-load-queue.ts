import {useEffect, useState} from 'react';

import {ScriptStore} from '../lib';

const noop = () => {};

export function useController<T>(store: ScriptStore<T>) {
    const [controller, setController] = useState<T | null>(null);

    useEffect(() => {
        if (store) {
            store.push(setController);

            return () => {
                const index = store.indexOf(setController);
                if (index > -1) {
                    store.splice(index, 1);
                }
            };
        }

        return noop;
    }, []);

    return controller;
}
