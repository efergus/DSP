
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
    url: new URL('./controller_worker.ts', import.meta.url),
    name: 'controller_worker'
}