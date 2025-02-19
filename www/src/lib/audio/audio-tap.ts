import { IirDigital } from "./iir";

export type AudioTapOptions = {
    silent?: boolean;
}

class AudioTap extends AudioWorkletProcessor {
    declare silent: boolean;
    declare buffers: Map<number, Float32Array[]>;

    constructor(options: AudioWorkletProcessorOptions = {}) {
        super(options);

        if ((options.numberOfInputs ?? 1) !== 1) {
            throw new Error("AudioTap handle more than one input!")
        }
        if ((options.numberOfOutputs ?? 1) !== 1) {
            throw new Error("AudioTap handle more than one output!")
        }

        this.port.onmessage = (e) => {
            const buffers = e.data ?? [];
            for (const buffer of buffers) {
                const arr = this.buffers.get(buffer.length) ?? [];
                arr.push(buffer);
                this.buffers.set(buffer.length, arr);
            }
        }

        this.silent = options.processorOptions?.silent ?? false;
        this.buffers = new Map();
    }
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        const input = inputs[0];
        const output = outputs[0];

        const C = input.length;
        const N = input[0].length;
        const buffers = this.buffers.get(N);
        const res = new Array(C);

        for (let channel = 0; channel < C; channel++) {
            res[channel] = buffers?.pop() ?? new Float32Array(N);
            res[channel].set(input[channel]);
            if (!this.silent) {
                output[channel].set(input[channel]);
            }
        }

        const transfer = res.map(arr => arr.buffer)
        this.port.postMessage(res, transfer);
        return true;
    }
}

registerProcessor('audio-tap', AudioTap);