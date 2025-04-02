import { axisLines } from "$lib/audio/axes";
import { point } from "$lib/math/point";
import { span1d, Span2D, span2d, span2dFromSpans, type Span1D } from "$lib/math/span";

type AxesOptions = {
    rect?: Span2D,
    span?: Span2D,
    spanX?: Span1D,
    spanY?: Span1D,
    size?: number,
    sizeX?: number,
    sizeY?: number,
    textSize?: number,
    maxDepth?: number,
    maxTextDepth?: number,
    maxInteriorDepth?: number
}

const levelSpan = span1d(255, 0);
const unitySpan = span1d(0, 1);
const level256 = (value: number, limit: number, modifier = 2) => {
    return unitySpan.remapClamped(modifier - modifier * (value / limit) ** 2, levelSpan);
}

export function drawAxes(context: CanvasRenderingContext2D, options: AxesOptions = {}): Span2D {
    const { rect: argRect,
        span,
        spanX: argSpanX,
        spanY: argSpanY,
        size = 32,
        sizeX = size,
        sizeY = size,
        textSize: baseTextSize = 12,
        maxDepth = 2,
        maxTextDepth = 1.3,
        maxInteriorDepth = 1.3 } = options;
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;
    const spanX = argSpanX ?? span?.x;
    const spanY = argSpanY ?? span?.y;
    const rect = argRect ?? span2d(0, canvasWidth, 0, canvasHeight);

    let screenSpanX: Span1D;
    let screenSpanY: Span1D;

    if (spanX) {
        const yAxisSpace = spanY ? sizeY : 0;
        screenSpanX = span1d(rect.x.min + yAxisSpace, rect.x.max);
    }
    else {
        screenSpanX = span1d(rect.x.min, rect.x.max);
    }

    if (spanY) {
        const xAxisSpace = spanX ? sizeX : 0;
        screenSpanY = span1d(rect.y.max - xAxisSpace, rect.y.min);
    }
    else {
        screenSpanY = span1d(rect.y.max, rect.y.min);
    }
    const screenSpan = span2dFromSpans(screenSpanX, screenSpanY);

    const drawAxis = (span: Span1D, vertical: boolean) => {
        context.save();
        // clip rectangle and reused values
        context.beginPath();
        let clipRect: Span2D;
        let offset: number;
        if (vertical) {
            clipRect = span2dFromSpans(rect.x, screenSpanY);
            context.textBaseline = 'hanging';
            offset = rect.x.min;
        } else {
            clipRect = span2dFromSpans(screenSpanX, rect.y);
            context.textBaseline = 'bottom';
            offset = rect.y.max;
        }
        context.rect(clipRect.x.min, clipRect.y.min, clipRect.width, clipRect.height);
        context.clip();

        const axis = axisLines(span, maxDepth);
        context.lineWidth = 1;
        const layers = Array.from(axis);
        const tickSpan = vertical ? screenSpanY : screenSpanX;
        const orthogonalSpan = vertical ? screenSpanX : screenSpanY;
        const base = orthogonalSpan.start;
        const interiorSize = orthogonalSpan.size();
        const textOffset = 4;

        for (let index = layers.length - 1; index >= 0; index--) {
            const layer = layers[index];

            // exterior (always visible) line styling
            const exteriorLevel = level256(layer.depth, maxDepth, 1);
            const exteriorColor = `rgb(${exteriorLevel}, ${exteriorLevel}, ${exteriorLevel})`;

            // interior (fewer visible) line styling
            const interiorLevel = level256(Math.max(layer.depth, maxInteriorDepth * 0.9), maxInteriorDepth);
            const interiorColor = `rgb(${interiorLevel}, ${interiorLevel}, ${interiorLevel})`;

            // text styling
            const textSize = Math.floor(baseTextSize * (0.6 + 0.4 * layer.weight));
            const textLevel = level256(layer.depth, maxTextDepth);
            const textColor = `rgb(${textLevel}, ${textLevel}, ${textLevel})`;
            context.font = `${textSize}px sans-serif`;

            // draw lines & text
            if (vertical) {
                for (const tick of layer.values) {
                    const pos = Math.floor(span.remap(tick, tickSpan));
                    const length = layer.weight * sizeY;

                    // exterior axis line
                    const offset = length;
                    context.fillStyle = exteriorColor;
                    context.fillRect(base - offset, pos, offset, 1);

                    if (layer.depth < maxInteriorDepth) {
                        // interior axis line
                        context.fillStyle = interiorColor;
                        context.fillRect(base, pos, interiorSize, 1);
                    }

                    if (layer.depth <= maxTextDepth) {
                        // axis label
                        context.fillStyle = textColor;
                        context.fillText(layer.format(tick), base - sizeY + textOffset, pos + textOffset);
                    }
                }
            }
            else {
                for (const tick of layer.values) {
                    const pos = Math.floor(span.remap(tick, tickSpan));
                    const length = layer.weight * sizeX;

                    // exterior axis line
                    const offset = length;
                    context.fillStyle = exteriorColor;
                    context.fillRect(pos, base, 1, offset);

                    if (layer.depth < maxInteriorDepth) {
                        // interior axis line
                        context.fillStyle = interiorColor;
                        context.fillRect(pos, base - interiorSize, 1, interiorSize);
                    }

                    if (layer.depth <= maxTextDepth) {
                        // axis label
                        context.fillStyle = textColor;
                        context.fillText(layer.format(tick), pos + textOffset, base + sizeX - textOffset);
                    }
                }
            }
        }
        context.restore();
    }

    if (spanX) {
        drawAxis(spanX, false);
    }
    if (spanY) {
        drawAxis(spanY, true);
    }

    // separator lines
    context.beginPath();
    context.fillStyle = 'black';
    context.rect(rect.x.min, screenSpanY.start, rect.x.size(), 1);
    context.rect(screenSpanX.start, rect.y.min, 1, rect.y.size());
    context.fill();
    return screenSpan;

}
