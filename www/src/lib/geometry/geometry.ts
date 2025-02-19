

export type XY<T> = {
    x: T,
    y: T
}

export type Point = XY<number>;

export type Span = {
    min: number,
    max: number
}

export type Span2D = XY<Span>

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