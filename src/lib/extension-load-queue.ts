// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserWindow = any;

export type ControllerLoadedCallback<T> = (controller: T) => void;

export const QUEUE_SYMBOL: unique symbol = Symbol.for('queue');

export type ScriptStore<T> = ControllerLoadedCallback<T>[] | null;

export interface CreateLoadQueueArgs<T> {
    store: ScriptStore<T>;
    createController: () => T;
    isQueueCreated?: boolean;
    onQueueCreated?: (created: boolean) => void;
}

export const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export const getScriptStore = <T>(key: symbol): ScriptStore<T> => {
    if (isBrowser()) {
        (window as BrowserWindow)[key] = (window as BrowserWindow)[key] || [];
        return (window as BrowserWindow)[key];
    }

    return null;
};

export const getQueueStore = () => {
    if (isBrowser()) {
        (window as BrowserWindow)[QUEUE_SYMBOL] = (window as BrowserWindow)[QUEUE_SYMBOL] || false;
        return (window as BrowserWindow)[QUEUE_SYMBOL];
    }

    return null;
};

export const handleQueueCreated = (created: boolean) => {
    (window as BrowserWindow)[QUEUE_SYMBOL] = created;
};

export const createLoadQueue = <T>({
    store,
    createController,
    isQueueCreated = getQueueStore(),
    onQueueCreated = handleQueueCreated,
}: CreateLoadQueueArgs<T>) => {
    if (!store || isQueueCreated) {
        return;
    }
    onQueueCreated(true);

    const controller = createController();

    const queue = store.splice(0, store.length);

    store.push = function (...args) {
        args.forEach((callback) => {
            queue.push(callback);
            unqueue();
        });

        return queue.length;
    };

    let processing = false;

    function unqueue() {
        if (!processing) {
            next();
        }
    }

    async function next(): Promise<void> {
        processing = true;

        const callback = queue.shift();
        if (callback) {
            await callback(controller);
            return next();
        }

        processing = false;
    }

    unqueue();
};
