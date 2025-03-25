

export function hann_index(n: number, N: number): number {
    return 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)));
}

export function apply_hann_window(data: Float32Array, limit?: number) {
    limit = Math.min(data.length, limit ?? data.length);
    for (let i = 0; i < limit; i++) {
        data[i] *= hann_index(i, limit);
    }
}

export function hann_windowed(data: Float32Array, pad: number = 0): Float32Array {
    let data_copy = new Float32Array(Math.max(data.length, pad));
    data_copy.set(data);
    apply_hann_window(data_copy, data.length);
    return data_copy;
}

export function pad_f32(input: Float32Array, length: number): Float32Array {
    const output = new Float32Array(Math.max(input.length, length));
    output.set(input);
    return output;
}

// export function rotate(input: Float32Array, offset: number) {
//     for (let i = 0; i < input.length; i++) {
//         input[i] = input[(input.length + i - offset) % input.length];
//     }
// }

export function rotated(input: Float32Array, offset: number): Float32Array {
    let data_copy = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
        data_copy[i] = input[(input.length + i - offset) % input.length];
    }
    return data_copy;
}