const MAX_FILTER_SIZE = 16;

export type AudioIirCommandArgs = {
    filter: Float32Array;
}

function applyIir(filter: Float32Array, input: Float32Array, output: Float32Array, prevInput: Float32Array, prevOutput: Float32Array) {
    const mid = filter.length / 2;
    for (let frame = 0; frame < input.length; frame++) {
        let acc = 0;
        for (let idx = 0; idx < mid; idx++) {
            const forward = filter[idx];
            const backward = filter[idx + mid];
            if (idx > frame) {
                acc += prevInput[MAX_FILTER_SIZE - idx] * forward - prevOutput[MAX_FILTER_SIZE - idx] * backward;
            } else {
                acc += input[frame - idx] * forward - output[frame - idx] * backward;
            }
        }
        output[frame] = acc;
    }
}

class AudioIir extends AudioWorkletProcessor {
    // an IIR filter defined by n values
    // forward coefficients in first half (derived from zeros)
    // backward coefficients in last half (derived from poles)
    declare filter: Float32Array;
    declare storedInputs: Float32Array[];
    declare storedOutputs: Float32Array[];

    constructor(options: AudioWorkletProcessorOptions = {}) {
        super(options);

        this.port.onmessage = (e) => {
            const args = e.data as AudioIirCommandArgs;
            this.filter = args.filter;
        }
        this.filter = new Float32Array([1, 0]);
        this.storedInputs = [];
        this.storedOutputs = [];
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        const inputChannels = inputs[0];
        const outputChannels = outputs[0];

        const C = inputChannels.length;
        const N = inputChannels[0]?.length ?? 0;
        if (!N || !outputs.length) {
            return true;
        }

        if (!this.storedInputs.length || !this.storedOutputs.length) {
            this.storedInputs = inputs.map(() => new Float32Array(MAX_FILTER_SIZE));
            this.storedOutputs = outputs.map(() => new Float32Array(MAX_FILTER_SIZE))
        }

        inputChannels.forEach((input, index) => {
            const output = outputChannels[index];
            applyIir(this.filter, input, output, this.storedInputs[index], this.storedOutputs[index]);
            this.storedInputs[index] = input.slice(input.length - MAX_FILTER_SIZE);
            this.storedOutputs[index] = output.slice(output.length - MAX_FILTER_SIZE);
        });
        return true;
    }
}

registerProcessor('iir_worker', AudioIir);