import { IirDigital } from "./iir";

class NoiseProcessor extends AudioWorkletProcessor {
    declare filter: IirDigital | null;
    declare lastInput: Float32Array[];
    declare lastOutput: Float32Array[];

    constructor(options: AudioWorkletProcessorOptions = {}) {
        super(options);
        console.log(options);
        // TODO handle unexpected number of inputs
        // if (options.outputChannelCount[0] !== options.inputChannelCount[0]) {
        //     throw new Error("Unequal input/output channel counts");
        // }
        this.port.onmessage = (e) => {
            console.log("Message:", e.data);
            const filter = e.data?.filter ?? null;
            if (filter) {
                this.filter = new IirDigital(filter.zeros, filter.poles, filter.gain);
            }
            console.log(this.filter);
        }
        this.filter = null;
        this.lastInput = [];
        this.lastOutput = [];
        for (let idx = 0; idx < (options.outputChannelCount?.[0] ?? 2); idx++) {
            this.lastInput.push(new Float32Array(128));
            this.lastOutput.push(new Float32Array(128));
        }
    }
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
        const input = inputs[0];
        const output = outputs[0];
        output.forEach((channel, channel_idx) => {
            let input_channel = input[channel_idx];
            if (this.filter) {
                let filteredOutput = this.filter.apply(input_channel, this.lastInput[channel_idx], this.lastOutput[channel_idx]);
                this.lastInput[channel_idx].set(input_channel);
                this.lastOutput[channel_idx].set(filteredOutput);
                channel.set(filteredOutput);
            }
            else {
                for (let i = 0; i < channel.length; i++) {
                    channel[i] = input_channel[i];
                    this.lastOutput[channel_idx][i] = channel[i];
                }
            }
        });
        // TODO handle different input/output sizes
        let data = new Float32Array(128);
        data.set(this.lastOutput[0]);
        this.port.postMessage(data, [data.buffer]);
        return true;
    }
}

registerProcessor('noise-processor', NoiseProcessor);