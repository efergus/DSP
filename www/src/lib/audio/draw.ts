import { span1d, type Span1D } from "$lib/math/geometry";

export type AxisScale = "linear" | "log";

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

export function draw_waveform_envelope(context: CanvasRenderingContext2D, values: Float32Array | number[], options: FilledWaveformOptions) {
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

export function draw_waveform(context: CanvasRenderingContext2D, values: Float32Array | number[], options: DrawWaveformOptions = {}) {
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

export type AxisLine = {
    label: string,
    pos: number,
    depth: number,
    index: number
}

export type AxisLayer = {
    magnitude: number,
    depth: number,
    start: number,
    index: number,
    base: number,
}

export function axisLayer(span: Span1D, base = 10): AxisLayer {
    const width = span.size();
    const widthLog = Math.log(width) / Math.log(base);
    const magnitude = Math.floor(widthLog);
    const depth = widthLog - magnitude;
    const step = base ** magnitude;
    const index = Math.floor(span.min / step);
    const start = (index * step - span.min) / width;
    return {
        magnitude,
        depth,
        start,
        index,
        base
    }
}

export function axisStart(start: number, depth: number, base = 10) {
    const size = base ** depth;
    return Math.floor(-start * size) / size;
}

function divisorPower(value: number, base = 10) {
    if (value === 0) {
        return { rem: 0, power: Infinity };
    }
    value = Math.abs(value);
    let power = 0;
    while (value >= base && (value % base === 0)) {
        value /= base;
        power++;
    }
    return {
        rem: value,
        power
    };
}

function axisLabel(index: number, magnitude: number, base = 10) {
    const { power, rem } = divisorPower(index);
    if (magnitude > 0) {
        return {
            label: index.toString(base),
            depth: -magnitude - power
        }
    }
    const remainingPower = -magnitude - power;
    const string = rem.toString(base);
    let whole = string.slice(0, string.length - remainingPower);
    let frac = string.slice(string.length - remainingPower, string.length);
    whole = whole.length > 0 ? whole : '0';
    frac = frac.length > 0 ? frac : '0';
    const sign = index < 0 ? '-' : '';
    return {
        label: `${sign}${whole}.${frac}`,
        depth: -magnitude - power
    };
}

export function axisLinesFromLayerAtDepth(layer: AxisLayer, depth: number) {
    const totalDepth = depth + layer.depth;
    const span = layer.base ** totalDepth;
    const count = Math.ceil(span);
    let lines: AxisLine[] = [];
    for (let index = Math.floor(-layer.start * span); index <= count; index++) {
        if (depth > 0 && index % layer.base === 0) {
            continue;
        }
        const { label, depth: labelDepth } = axisLabel(index + layer.index * layer.base ** depth, layer.magnitude - depth, layer.base)
        lines.push({
            label,
            depth: labelDepth + layer.depth,
            pos: layer.start + index / span,
            index
        })
    }
    return lines;
}

export function* axisLines2(span: Span1D, density = 2.3) {
    const layer = axisLayer(span);
    for (let depth = 0; depth + layer.depth < density; depth++) {
        yield axisLinesFromLayerAtDepth(layer, depth);
    }
}

function divisorPowerWithSecondary(value: number, base = 10, secondary = 5, secondaryValue = 0.3) {
    if (value === 0) {
        return Infinity;
    }
    value = Math.abs(value);
    let power = 0;
    while (value >= base && (value % base === 0)) {
        value /= base;
        power++;
    }
    if (value >= secondary && value % secondary === 0) {
        return power + 0.4;
    }
    return power;
}

export function* axisLines(span: Span1D, density = 2.5, scale = 1) {
    const width = span.max - span.min;
    const widthLog = Math.log10(width);
    const magnitude = Math.floor(widthLog - density + 0.6);
    const remainder = widthLog - magnitude - density;
    const step = 10 ** magnitude;
    const left = Math.floor(span.min / step);
    const right = Math.ceil(span.max / step);

    if (right >= Number.MAX_SAFE_INTEGER) {
        throw Error(`${right} too big`)
    }

    for (let index = left; index <= right; index++) {
        let depth = 0;
        let power = -magnitude;
        if (index !== 0) {
            power = divisorPowerWithSecondary(index);
            depth = density + remainder - power;
        }
        const value = index * step;
        const pos = span.remap(value, span1d(0, scale));
        yield {
            label: value.toFixed(Math.max(-magnitude - Math.floor(power), 0)),
            depth: depth,
            pos,
            index
        }
    }
}
