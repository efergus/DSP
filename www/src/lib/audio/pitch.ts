
export function median(data: number[]) {
    data.sort((a, b) => a - b);
    let idx = data.length / 2;
    return (data[Math.floor(idx)] + data[Math.ceil(idx)]) / 2;
}

export function zero_crossing_distances(data: Float32Array) {
    let prev = 0;
    let crossings = [];
    for (let idx = 1; idx < data.length; idx++) {
        if ((data[idx - 1] < 0) != (data[idx] < 0)) {
            if (prev > 0) {
                crossings.push(idx - prev);
            }
            prev = idx;
        }
    }
    return crossings;
}

export function zero_crossing_median(data: Float32Array) {
    let crossings = zero_crossing_distances(data);
    return median(crossings);
}