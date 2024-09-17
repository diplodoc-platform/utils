import {AttrsParser} from './attrs';
import {
    ControllerLoadedCallback,
    CreateLoadQueueArgs,
    ScriptStore,
    createHandleQueueCreated,
    createLoadQueue,
    getQueueStore,
    getScriptStore,
    useController,
} from './extension-load-queue';
import {isBrowser} from './browser';

export {
    AttrsParser,
    createLoadQueue,
    getQueueStore,
    getScriptStore,
    createHandleQueueCreated,
    isBrowser,
    useController,
};

export type {ControllerLoadedCallback, CreateLoadQueueArgs, ScriptStore};
