import { type Span1D } from "$lib/math/span";

export enum AxisScale {
    Linear = 'linear',
    Log = 'log'
};

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
    skip: number,
    ticks: Iterable<{ value: number, index: number }>
}

function* rangeWithSkip(start: number, end: number, skip: number) {
    for (let index = start; index < end; index++) {
        if (skip && (index % skip === 0)) {
            continue;
        }
        yield index;
    }
}

function* axisLineHelper(startIndex: number, endIndex: number, offset: number, scale: number, skip: number) {
    for (const index of rangeWithSkip(startIndex, endIndex, skip)) {
        yield {
            value: offset + index / scale,
            index
        }
    }
}

function formatLabel(magnitude: number) {
    const precision = -Math.min(magnitude, 0);
    return (value: number) => value.toFixed(precision);
}

export function* axisLines(span: Span1D, maxDepth: number = 1.4): Generator<DetailedAxisLayer> {
    const width = span.size();
    const widthLog = Math.log10(width);
    const magnitude = Math.ceil(widthLog);
    const startDepth = widthLog - magnitude;
    let zoom = 1;
    let skip = 0;
    const scalingFactors = [2, 5];
    let scalingFactorIndex = 0;
    let depth = 0;
    // yield each layer at a given depth
    // each +1 increase in depth is a zoom of 10x
    while (depth < maxDepth) {
        // zoom is the inverse of spacing between ticks
        const effectiveZoom = magnitude > 0 ? zoom / 10 ** magnitude : zoom * 10 ** (-magnitude);
        // number of ticks from zero to before the start of the span
        const startIndex = Math.floor(span.start * effectiveZoom);
        // number of ticks from zero to after the end of the span
        const endIndex = Math.ceil(span.end * effectiveZoom) + 1;
        const start = startIndex / effectiveZoom;
        const effectiveMagnitude = -Math.ceil(Math.log10(effectiveZoom));
        yield {
            depth,
            weight: 1 - (depth / maxDepth),
            magnitude: effectiveMagnitude,
            zoom: effectiveZoom,
            spacing: 1 / effectiveZoom,
            start,
            skip,
            ticks: axisLineHelper(startIndex, endIndex, 0, effectiveZoom, skip),
            values: axisLineHelper(startIndex, endIndex, 0, effectiveZoom, skip).map(t => t.value),
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
