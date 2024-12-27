
class NoiseProcessor extends AudioWorkletProcessor {
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
        return true;
    }
}

registerProcessor('noise-processor', NoiseProcessor);