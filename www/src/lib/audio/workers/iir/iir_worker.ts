const MAX_FILTER_SIZE = 16;

export type AudioIirCommandArgs = {
    filter: Float32Array;
    debug?: boolean;
}

function applyIir(filter: Float32Array, input: Float32Array, output: Float32Array, prevInput: Float32Array, prevOutput: Float32Array) {
    let clip = false;
    for (let frame = 0; frame < input.length; frame++) {
        let acc = 0;
        for (let delay = 0; delay * 2 < filter.length; delay++) {
            const forward = filter[delay * 2];
            const backward = filter[delay * 2 + 1];
            if (delay > frame) {
                acc += prevInput[MAX_FILTER_SIZE + frame - delay] * forward - prevOutput[MAX_FILTER_SIZE + frame - delay] * backward;
            } else {
                acc += input[frame - delay] * forward - output[frame - delay] * backward;
            }
        }
        const size = Math.abs(acc);
        if (size > 1) {
            acc = Math.sign(acc);
        }
        if (size > 2) {
            clip = true;
        }
        output[frame] = acc;
    }
    return clip;
}

class AudioIir extends AudioWorkletProcessor {
    // an IIR filter defined by n values
    // forward coefficients in first half (derived from zeros)
    // backward coefficients in last half (derived from poles)
    declare filter: Float32Array;
    declare storedInputs: Float32Array[];
    declare storedOutputs: Float32Array[];
    declare zeros: number;
    declare debug: boolean;

    constructor(options: AudioWorkletProcessorOptions = {}) {
        super(options);

        this.port.onmessage = (e) => {
            const args = e.data as AudioIirCommandArgs;
            this.filter = args.filter;
            this.debug = !!args.debug;
        }
        this.filter = new Float32Array([1, 0]);
        this.storedInputs = [];
        this.storedOutputs = [];
        this.zeros = 0;
        this.debug = false;
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        const inputChannels = inputs[0];
        const outputChannels = outputs[0];

        const C = inputChannels.length;
        const N = inputChannels[0]?.length ?? 0;
        if (!N || !outputs.length) {
            this.zeros += 1;
            return true;
        }

        if (!this.storedInputs.length || !this.storedOutputs.length) {
            this.storedInputs = inputChannels.map(() => new Float32Array(MAX_FILTER_SIZE));
            this.storedOutputs = outputChannels.map(() => new Float32Array(MAX_FILTER_SIZE))
        }

        let zero = true;
        let clip = false;
        inputChannels.forEach((input, index) => {
            const output = outputChannels[index];
            if (!input.every(v => v === 0)) {
                zero = false;
            }
            if (applyIir(this.filter, input, output, this.storedInputs[index], this.storedOutputs[index])) {
                clip = true;
                console.log(input.slice(), output.slice())
            }
            this.storedInputs[index] = input.slice(input.length - MAX_FILTER_SIZE);
            this.storedOutputs[index] = output.slice(output.length - MAX_FILTER_SIZE);
        });
        if (zero) {
            this.zeros += 1;
        }
        if (this.zeros >= 4 || clip) {
            this.zeros = 0;
            for (let idx = 0; idx < C; idx++) {
                this.storedInputs[idx].fill(0);
                this.storedOutputs[idx].fill(0);
            }
        }
        if (this.debug) {
            const data = outputChannels[0].slice();
            this.port.postMessage({
                output: data
            }, [data.buffer])
        }
        return true;
    }
}

registerProcessor('iir_worker', AudioIir);