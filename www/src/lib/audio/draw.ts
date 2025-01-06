
export type DrawWaveformOptions = {
    offset?: number;
    limit?: number;
    scale?: number;
    x?: number;
    y?: number;
    width?: number;
};

type FilledWaveformOptions = Required<DrawWaveformOptions>;

export function combine(values: Float32Array[], destination?: Float32Array) {
    if (!values.length) {
        return new Float32Array(0);
    }
    const stride = values[0].length;
    const arr = destination ?? new Float32Array(stride * values.length);
    for (let i = 0; i < values.length; i++) {
        arr.set(values[i], i * stride);
    }
    return arr;
}

export function draw_waveform_envelope(context: CanvasRenderingContext2D, values: Float32Array, options: FilledWaveformOptions) {
    const { limit: length, offset, scale, x, y, width } = options;

    const end = Math.min(offset + length, values.length)
    const bin_size = length / width;
    const span_mins = [];
    const span_maxs = [];
    let frame = offset;
    let bin = 0;

    while (frame < end) {
        let cutoff = Math.min(end, offset + bin_size * bin);
        let span_min = values[frame];
        let span_max = values[frame];
        while (frame < cutoff) {
            span_max = Math.max(values[frame], span_max);
            span_min = Math.min(values[frame], span_min);
            frame++;
        }
        span_maxs.push(span_max);
        span_mins.push(span_min);
        bin++;
    }

    const stride = width / (span_mins.length - 1);
    context.beginPath();
    for (let idx = 0; idx < span_mins.length; idx++) {
        // first lineTo is treated as a moveTo
        context.lineTo(x + idx * stride, span_mins[idx] * -scale + y);
    }
    for (let idx = span_maxs.length - 1; idx >= 0; idx--) {
        context.lineTo(x + idx * stride, span_maxs[idx] * -scale + y);
    }
    context.closePath();
    context.stroke();
    context.fill();
}

export function draw_waveform(context: CanvasRenderingContext2D, values: Float32Array, options: DrawWaveformOptions = {}) {
    const canvas = context.canvas;
    if (!values.length) {
        return;
    }
    const { offset = 0, scale = canvas.height / 2, x = 0, width = canvas.width } = options;
    const y = canvas.height - (options.y ?? (canvas.height / 2));
    const length = Math.min(options.limit ?? Infinity, values.length - offset);

    if (length * 2 > canvas.width) {
        draw_waveform_envelope(context, values, {
            offset, limit: length, scale, x, y, width
        })
    }
    else {
        const dx = width / length;

        context.lineWidth = 2;
        context.strokeStyle = 'rgb(0 0 0)';

        context.beginPath();
        context.moveTo(x, y);
        for (let i = 0; i < length; i++) {
            const val = values[i + offset];
            context.lineTo(x + dx * i, y - val * scale)
        }
        context.stroke();
    }
}