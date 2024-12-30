
export type DrawWaveformOptions = {
    offset?: number;
    length?: number;
    scale?: number;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    }
};

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

export function draw_waveform(context: CanvasRenderingContext2D, values: Float32Array, options: DrawWaveformOptions = {}) {
    const canvas = context.canvas;
    if (!values.length) {
        return;
    }
    const { offset = 0, scale = 1, rect = {
        x: 0, y: 0, width: canvas.width, height: canvas.height
    } } = options;
    const length = Math.min(options.length ?? Infinity, values.length - offset);

    const x = rect.x;
    const y = rect.y + rect.height / 2;
    const dx = rect.width / length;

    context.lineWidth = 2;
    context.strokeStyle = 'rgb(0 0 0)';

    context.beginPath();
    context.moveTo(x, y);
    for (let i = 0; i < length; i++) {
        const val = values[i];
        context.lineTo(x + dx * i, y + val * scale)
    }
    context.stroke();
}