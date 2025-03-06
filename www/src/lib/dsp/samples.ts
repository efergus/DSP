import { SampleData } from "$lib/audio/sample";

export const square_sample = (freq = 440, samplerate = 44100, length?: number) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        res[i] = Math.sin(2 * Math.PI * freq * i / samplerate) >= 0 ? 1 : -1;
    }
    return new SampleData(res, samplerate);
};

export const chirp_sample = (base_freq = 20, peak_freq = 1000, samplerate = 44100, length?: number) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    let phase = 0;
    for (let i = 0; i < length; i++) {
        const current_freq =
            base_freq + (peak_freq - base_freq) * (i / length);
        res[i] = Math.sin(2 * Math.PI * phase);
        phase += current_freq / samplerate;
    }
    return new SampleData(res, samplerate);
};


export const wobble_sample = (base_freq = 20, peak_freq = 1000, samplerate = 44100, length?: number) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    let phase = 0;
    for (let i = 0; i < length; i++) {
        let current_freq =
            base_freq + (peak_freq - base_freq) * (1 - 0.5 * Math.sin((2 * Math.PI * i) / samplerate));
        res[i] = Math.sin(2 * Math.PI * phase);
        phase += current_freq / samplerate;
    }
    return new SampleData(res, samplerate);
};