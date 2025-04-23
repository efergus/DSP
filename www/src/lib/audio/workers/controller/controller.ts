
import workerUrl from './controller_worker.ts?worker&url';

export type AudioControllerCommandArgs = {
    sample?: Float32Array;
    seek?: number;
    play?: boolean;
}

export type AudioControllerMessage = {
    frame: number;
    remaining: number;
}

export let audioControllerInfo = {
    url: workerUrl,
    name: 'controller_worker'
}