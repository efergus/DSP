import type { AudioControllerCommandArgs } from "./controller";


class AudioController extends AudioWorkletProcessor {
    declare index: number;
    declare sample: Float32Array | null;
    declare frame: number;
    declare playing: boolean;

    constructor(options: AudioWorkletProcessorOptions = {}) {
        super(options);

        this.port.onmessage = (e) => {
            const args = e.data as AudioControllerCommandArgs;
            if (args.sample !== undefined) {
                this.sample = args.sample;
                this.frame = 0;
            }
            if (args.play !== undefined) {
                this.playing = args.play;
            }
            if (args.seek !== undefined) {
                this.frame = args.seek;
            }
        }

        this.sample = null;
        this.frame = 0;
        this.playing = true;
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        if (!this.playing || !this.sample) {
            return true;
        }
        const output = outputs[0];

        const C = output.length;
        const N = Math.min(output[0]?.length ?? 0, this.sample.length - this.frame);
        if (!N || !outputs.length) {
            return true;
        }

        for (let frame = 0; frame < N; frame++) {
            output[0][frame] = this.sample[this.frame + frame];
        }
        for (let channel = 1; channel < C; channel++) {
            output[channel].set(output[0]);
        }
        this.frame += N;
        this.port.postMessage({
            frame: this.frame,
            remaining: this.sample.length - this.frame
        })
        return true;
    }
}

registerProcessor('controller_worker', AudioController);