

export function hann_index(n: number, N: number): number {
    return 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)));
}

export function apply_hann_window(data: Float32Array) {
    for (let i = 0; i < data.length; i++) {
        data[i] *= hann_index(i, data.length);
    }
}

export function hann_windowed(data: Float32Array, pad: number = 0): Float32Array {
    let data_copy = new Float32Array(Math.max(data.length, pad));
    data_copy.set(data);
    apply_hann_window(data_copy.slice(0, data.length));
    return data_copy;
}

export function pad(input: Float32Array, length: number): Float32Array {
    const output = new Float32Array(length);
    output.set(input);
    return output;
}