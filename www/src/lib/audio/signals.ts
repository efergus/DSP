
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
