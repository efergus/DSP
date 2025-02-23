import { context } from "$lib/dsp/dsp";
import { complex_polar } from "../dsp/complex";

export function whiteNoise(samples = 128, iters = 8) {
    const data = new Float32Array(samples);
    for (let idx = 0; idx < samples; idx++) {
        for (let iter = 0; iter < iters; iter++) {
            data[idx] += Math.random() * 2 - 1;
        }
        data[idx] /= iters;
    }
    return data;
}

// TODO handle odd numbers of samples
export function phaseNoise(samples = 128) {
    let fft_context = context();

    const spectrum = new Float32Array(samples + 2);

    for (let idx = 2; idx < samples; idx += 2) {
        const phase = Math.random() * Math.PI * 2;
        const val = complex_polar(phase, 1 / samples);
        spectrum[idx] = val.re;
        spectrum[idx + 1] = val.im;
    }

    return fft_context.fft_inverse(spectrum);
}