import { SampleData } from "$lib/audio/sample";
import { complex_polar } from "./complex";
import { context } from "./dsp";

export const chirpSample = (base_freq = 20, peak_freq = 1000, samplerate = 44100, length?: number, amplitude = 1) => {
    // (x^2/2)' = x
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    const chirpRate = (peak_freq - base_freq) / length;
    for (let i = 0; i < length; i++) {
        res[i] = Math.sin(2 * Math.PI * (base_freq + chirpRate * i) * i / samplerate) * amplitude;
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

export function whiteNoise(samples = 128, iters = 8, amplitude = 1) {
    const data = new Float32Array(samples);
    for (let idx = 0; idx < samples; idx++) {
        for (let iter = 0; iter < iters; iter++) {
            data[idx] += Math.random() * 2 - 1;
        }
        data[idx] /= iters;
    }
    return data;
}

export function whiteNoiseSample(samples = 128, amplitude = 1) {
    return new SampleData(whiteNoise(samples, 8, amplitude));
}

export function pinkNoise(samples = 128, degree = 0.5, amplitude = 1) {
    const data = whiteNoise(samples, 8);

    let fft_context = context();
    const spectrum = fft_context.fft(data);

    for (let idx = 2; idx < samples; idx += 2) {
        const frequency = idx / samples;
        const gain = amplitude / Math.pow(frequency, degree);
        spectrum[idx] *= gain;
        spectrum[idx + 1] *= gain;
    }

    const res = fft_context.fft_inverse(spectrum);

    let attenuation = 1;
    for (let idx = 0; idx < samples; idx++) {
        attenuation = Math.max(attenuation, Math.abs(res[idx]));
    }
    for (let idx = 0; idx < samples; idx++) {
        res[idx] /= attenuation;
    }

    return res;
}

export function pinkNoiseSample(samples = 128, degree = 0.5, amplitude = 1) {
    return new SampleData(pinkNoise(samples, degree, amplitude));
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

export function phaseNoiseSample(samples = 128) {
    return new SampleData(phaseNoise(samples));
}

export function sinSample(freq = 440, samplerate = 44100, length?: number, amplitude = 1) {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        res[i] = Math.sin(2 * Math.PI * freq * i / samplerate) * amplitude;
    }
    return new SampleData(res, samplerate);
}

export const squareSample = (freq = 440, samplerate = 44100, length?: number, amplitude = 1) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        res[i] = (((freq * i) % samplerate) <= samplerate / 2) ? amplitude : -amplitude;
    }
    return new SampleData(res, samplerate);
};

export const sawSample = (freq = 440, samplerate = 44100, length?: number, amplitude = 1) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const phase = (freq * i) % samplerate;
        res[i] = (phase / samplerate * 2 - 1) * amplitude;
    }
    return new SampleData(res, samplerate);
};

export const triangleSample = (freq = 440, samplerate = 44100, length?: number, amplitude = 1) => {
    length = length ?? samplerate * 4;
    let res = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        const phase = (freq * i) % samplerate;
        res[i] = (Math.abs(phase / samplerate * 2 - 1) * 2 - 1) * amplitude;
    }
    return new SampleData(res, samplerate);
};