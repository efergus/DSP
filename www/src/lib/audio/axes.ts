import { span1d, type Span1D } from "$lib/math/span";

export enum AxisScale {
    Linear = 'linear',
    Log = 'log'
};

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

export type AxisLayer = {
    depth: number,
    weight: number,
    values: Iterable<number>,
    format: (value: number) => string
}

export type DetailedAxisLayer = AxisLayer & {
    magnitude: number,
    zoom: number,
    spacing: number,
    start: number,
    skip: number
}

function* rangeWithSkip(start: number, end: number, skip: number) {
    for (let index = start; index < end; index++) {
        if (skip && (index % skip === 0)) {
            continue;
        }
        yield index;
    }
}

// function axisLevel(span: Span1D, )

function* axisLineHelper(startIndex: number, endIndex: number, offset: number, scale: number, skip: number) {
    for (const index of rangeWithSkip(startIndex, endIndex, skip)) {
        yield offset + index / scale;
    }
}

function formatLabel(magnitude: number) {
    const precision = -Math.min(magnitude, 0);
    return (value: number) => value.toFixed(precision);
}

export function* axisLines3(span: Span1D, maxDepth: number = 1.4): Generator<DetailedAxisLayer> {
    const width = span.size();
    const widthLog = Math.log10(width);
    const magnitude = Math.ceil(widthLog);
    const startDepth = widthLog - magnitude;
    let zoom = 1;
    let skip = 0;
    const scalingFactors = [2, 5];
    let scalingFactorIndex = 0;
    let depth = 0;
    while (depth < maxDepth) {
        const effectiveZoom = magnitude > 0 ? zoom / 10 ** magnitude : zoom * 10 ** (-magnitude);
        const startIndex = Math.floor(span.start * effectiveZoom);
        const endIndex = Math.ceil(span.end * effectiveZoom) + 1;
        const start = startIndex / effectiveZoom;
        const effectiveMagnitude = -Math.ceil(Math.log10(effectiveZoom));
        // yield each layer at a given depth
        yield {
            depth,
            weight: 1 - (depth / maxDepth),
            magnitude: effectiveMagnitude,
            zoom: effectiveZoom,
            spacing: 1 / effectiveZoom,
            start,
            skip,
            values: axisLineHelper(startIndex, endIndex, 0, effectiveZoom, skip),
            format: formatLabel(effectiveMagnitude)
        }

        zoom *= scalingFactors[scalingFactorIndex];
        skip = scalingFactors[scalingFactorIndex];
        scalingFactorIndex = (scalingFactorIndex + 1) % scalingFactors.length
        depth = Math.max(startDepth + Math.log10(zoom), 0);
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
    const remainingPower = -magnitude - power;
    if (magnitude > 0) {
        return index.toString(base);
    }
    if (remainingPower <= 0) {
        return rem.toString(base);
    }
    const string = rem.toString(base);
    let whole = string.slice(0, string.length - remainingPower);
    let frac = string.slice(string.length - remainingPower, string.length);
    whole = whole.length > 0 ? whole : '0';
    frac = frac.length > 0 ? frac : '0';
    const sign = index < 0 ? '-' : '';
    return `${sign}${whole}.${frac}`;
}

export function* axisLines2(span: Span1D, density = 2.3) {
    const base = 10;
    const secondary = 5;
    const width = span.size();
    const widthLog = Math.log(width) / Math.log(base);
    const magnitude = Math.floor(widthLog);
    const remainder = widthLog - magnitude;

    for (let depth = Math.ceil(density + remainder); depth >= 0; depth--) {
        const step = 10 ** (magnitude - depth);
        const start = Math.floor(span.start / step);
        const end = Math.ceil(span.end / step);
        for (let index = start; index <= end; index++) {
            let adjustment = 0.0;
            if (depth > 0) {
                if (index % base === 0) {
                    continue;
                }
            }
            else if (index % base === 0) {
                adjustment -= 1;
            }
            if (secondary && index % secondary === 0) {
                adjustment -= 0.3;
            }
            const result = Math.max(depth + remainder + adjustment, 0);
            if (result > density) {
                continue;
            }

            const value = index * step;
            yield {
                label: axisLabel(index, magnitude - depth, base),
                depth: result,
                pos: (value - span.start) / width,
                index
            }
        }
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
    const width = span.end - span.start;
    const widthLog = Math.log10(width);
    const magnitude = Math.floor(widthLog - density + 0.6);
    const remainder = widthLog - magnitude - density;
    const step = 10 ** magnitude;
    const left = Math.floor(span.start / step);
    const right = Math.ceil(span.end / step);

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

export function* axisLinesLog(span: Span1D, maxDepth: number = 1): Generator<AxisLayer> {
    const minLog = Math.floor(Math.log10(span.start));
    const maxLog = Math.ceil(Math.log10(span.end));

    // Major lines (powers of 10)
    const majorValues: number[] = [];
    for (let exp = minLog; exp <= maxLog; exp++) {
        const value = Math.pow(10, exp);
        if (value >= span.start && value <= span.end) {
            majorValues.push(value);
        }
    }

    yield {
        depth: 0,
        weight: 1,
        values: majorValues,
        format: (value: number) => value.toExponential(0)
    };

    if (maxDepth < 1) {
        return;
    }

    // Minor lines in between powers of 10
    const minorValues: number[] = [];
    for (let exp = minLog; exp <= maxLog; exp++) {
        const baseValue = Math.pow(10, exp);
        for (let i = 2; i < 10; i++) {
            const value = i * baseValue;
            if (value >= span.start && value <= span.end) {
                minorValues.push(value);
            }
        }
    }

    yield {
        depth: 1,
        weight: 0.1,
        values: minorValues,
        format: (value: number) => value.toExponential(1)
    };
}
