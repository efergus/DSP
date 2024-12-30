
class NoiseProcessor extends AudioWorkletProcessor {
    constructor(...args) {
        super(...args);
        this.port.onmessage = (e) => {
            console.log("Message:", e.data);
        }
    }
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        output.forEach((channel, channel_idx) => {
            let input_channel = input[channel_idx];
            for (let i = 0; i < channel.length; i++) {
                // let rand = (Math.random() * 2 - 1) * 0.003;
                channel[i] = input_channel[i];
            }
        });
        this.port.postMessage(inputs[0], [inputs[0][0].buffer, inputs[0][1].buffer]);
        return true;
    }
}

registerProcessor('noise-processor', NoiseProcessor);