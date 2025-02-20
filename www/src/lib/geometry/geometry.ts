

export type XY<T> = {
    x: T,
    y: T
}

export type Point = XY<number>;

export type Span1D = {
    min: number,
    max: number
}

export type Span2D = XY<Span1D>

export function point(x = 0, y = 0) {
    return { x, y }
}

export function pointCopy(p: Point) {
    return point(p.x, p.y);
}

export function span1d(min = 0, max = 1): Span1D {
    return { min, max }
}

export function span1dCopy(s: Span1D): Span1D {
    return { min: s.min, max: s.max }
}

export function span1dMove(s: Span1D, x: number): Span1D {
    return { min: s.min + x, max: s.max + x }
}

export function remapNumber(value: number, from: Span1D, to: Span1D): number {
    return to.min + (value - from.min) * (to.max - to.min) / (from.max - from.min);
}

export function remapPoint(p: Point, from: Span2D, to: Span2D): Point {
    return {
        x: remapNumber(p.x, from.x, to.x),
        y: remapNumber(p.y, from.y, to.y)
    }
}

export function span2d(minX = 0, maxX = 1, minY = 0, maxY = 1): Span2D {
    return {
        x: {
            min: minX,
            max: maxX
        },
        y: {
            min: minY,
            max: maxY
        }
    }
}

export function span2dMove(s: Span2D, x: number, y: number): Span2D {
    return {
        x: span1dMove(s.x, x),
        y: span1dMove(s.y, y)
    }
}

export function span2dCopy(s: Span2D): Span2D {
    return {
        x: { min: s.x.min, max: s.x.max },
        y: { min: s.y.min, max: s.y.max }
    }
}