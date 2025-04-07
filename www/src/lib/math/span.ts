import { Point } from "./point";

export class Span1D {
    constructor(public start: number = 0, public end: number = 1) { }

    get min(): number {
        return Math.min(this.start, this.end);
    }

    get max(): number {
        return Math.max(this.start, this.end);
    }

    copy(): Span1D {
        return new Span1D(this.start, this.end);
    }

    /**
     * Moves the Span1D object by a specified distance.
     * 
     * @param {number} x - The distance to move the span. This value can be positive or negative.
     * @returns {Span1D} - A new Span1D object after the movement.
     */
    move(x: number): Span1D {
        return new Span1D(this.start + x, this.end + x);
    }

    /**
     * Moves the Span1D object by a specified distance while enforcing movement limits.
     * 
     * @param {number} x - The distance to move the span. This value can be positive or negative.
     * @param {Span1D} limits - An object representing the minimum and maximum limits for the movement.
     * @returns {Span1D} - A new Span1D object after the movement, constrained within the specified limits.
     * 
     * The function checks if moving the span by the specified distance would exceed the defined limits.
     * If so, it adjusts the movement to ensure that the span remains within the limits.
     */
    moveWithLimits(x: number, limits: Span1D): Span1D {
        const minDelta = limits.min - this.min;
        if (minDelta > x) {
            return this.move(minDelta)
        }
        const maxDelta = this.max - limits.max;
        if (maxDelta > x) {
            return this.move(maxDelta)
        }
        return this.move(x);
    }

    /**
     * Scales the Span1D object by a specified scale factor.
     * 
     * @param {number} scale - The scale factor to apply to the span. This value can be positive or negative.
     * @param {number} center - The center point of the span. If not provided, the center is the center of the span.
     * @returns {Span1D} - A new Span1D object after the scaling.
     */
    scale(scale: number, center?: number): Span1D {
        center = center ?? ((this.end + this.start) / 2);
        const d1 = this.start - center;
        const d2 = this.end - center;
        return new Span1D(center + d1 * scale, center + d2 * scale);
    }

    /**
     * Intersects two Span1D objects.
     * 
     * @param {Span1D} span1 - The first span to intersect.
     * @param {Span1D} span2 - The second span to intersect.
     * @returns {Span1D} - A new Span1D object representing the intersection of the two spans.
     * 
     * Note: This function always re-orients the resulting span so that start < end.
     */
    static intersect(span1: Span1D, span2: Span1D): Span1D {
        return new Span1D(
            Math.max(span1.min, span2.min),
            Math.min(span1.max, span2.max)
        );
    }

    intersect(span: Span1D): Span1D {
        return Span1D.intersect(this, span);
    }

    remap(value: number, to: Span1D = UNIT_SPAN1): number {
        return to.start + (value - this.start) * (to.end - to.start) / (this.end - this.start);
    }

    remapSize(value: number, to: Span1D = UNIT_SPAN1): number {
        return value / this.size() * to.size();
    }

    remapClamped(value: number, to: Span1D = UNIT_SPAN1): number {
        return to.clamp(this.remap(value, to));
    }

    equals(span: Span1D): boolean {
        return this.start === span.start && this.end === span.end;
    }

    size(): number {
        return Math.abs(this.end - this.start);
    }

    sizeSigned(): number {
        return this.end - this.start;
    }

    sign(): number {
        return Math.sign(this.end - this.start);
    }

    center(): number {
        return (this.end + this.start) / 2;
    }

    clamp(value: number): number {
        return Math.max(this.min, Math.min(this.max, value));
    }

    contains(value: number): boolean {
        return value >= this.min && value <= this.max;
    }
}

export class Span2D {
    constructor(
        public x: Span1D = new Span1D(),
        public y: Span1D = new Span1D()
    ) { }

    static fromBounds(minX = 0, maxX = 1, minY = 0, maxY = 1): Span2D {
        return new Span2D(
            new Span1D(minX, maxX),
            new Span1D(minY, maxY)
        );
    }

    static fromSpans(x: Span1D, y: Span1D): Span2D {
        return new Span2D(x, y);
    }

    get width(): number {
        return this.x.size();
    }

    get height(): number {
        return this.y.size();
    }

    /**
     * Moves the Span2D object by specified distances in the x and y directions.
     * 
     * @param {number} x - The distance to move the span in the x direction. This value can be positive or negative.
     * @param {number} y - The distance to move the span in the y direction. This value can be positive or negative.
     * @returns {Span2D} - A new Span2D object after the movement.
     */
    move(x: number, y: number): Span2D {
        return new Span2D(
            this.x.move(x),
            this.y.move(y)
        );
    }

    /**     
     * Moves the Span2D object by specified distances in the x and y directions while enforcing movement limits.
     * 
     * @param {number} x - The distance to move the span in the x direction. This value can be positive or negative.
     * @param {number} y - The distance to move the span in the y direction. This value can be positive or negative.
     * @param {Span2D} limits - An object representing the minimum and maximum limits for the movement in both x and y directions.
     * @returns {Span2D} - A new Span2D object after the movement, constrained within the specified limits.
     * 
     * The function checks if moving the span by the specified distances would exceed the defined limits.
     * If so, it adjusts the movement to ensure that the span remains within the limits.
     */
    moveWithLimits(x: number, y: number, limits: Span2D): Span2D {
        return new Span2D(
            this.x.moveWithLimits(x, limits.x),
            this.y.moveWithLimits(y, limits.y)
        );
    }

    copy(): Span2D {
        return new Span2D(this.x.copy(), this.y.copy());
    }

    scale(scale: number | Point, center?: Partial<Point>): Span2D {
        const scale2d = typeof scale === "number" ?
            new Point(scale, scale) :
            scale;

        return new Span2D(
            this.x.scale(scale2d.x, center?.x),
            this.y.scale(scale2d.y, center?.y)
        );
    }

    remap(point: Point, to: Span2D = UNIT_SPAN2): Point {
        return new Point(
            this.x.remap(point.x, to.x),
            this.y.remap(point.y, to.y)
        );
    }

    remapSize(point: Point, to: Span2D = UNIT_SPAN2): Point {
        return new Point(
            this.x.remapSize(point.x, to.x),
            this.y.remapSize(point.y, to.y)
        );
    }

    remapClamped(point: Point, to: Span2D = UNIT_SPAN2): Point {
        return new Point(
            this.x.remapClamped(point.x, to.x),
            this.y.remapClamped(point.y, to.y)
        );
    }

    static intersect(span1: Span2D, span2: Span2D): Span2D {
        return new Span2D(
            span1.x.intersect(span2.x),
            span1.y.intersect(span2.y)
        );
    }

    intersect(span: Span2D): Span2D {
        return Span2D.intersect(this, span);
    }

    center(): Point {
        return new Point(this.x.center(), this.y.center());
    }

    equals(span: Span2D): boolean {
        return this.x.equals(span.x) && this.y.equals(span.y);
    }

    size(): Point {
        return new Point(this.x.size(), this.y.size());
    }

    clamp(point: Point): Point {
        return new Point(this.x.clamp(point.x), this.y.clamp(point.y));
    }

    contains(point: Point): boolean {
        return this.x.contains(point.x) && this.y.contains(point.y);
    }
}

export function span1d(min = 0, max = 1): Span1D {
    return new Span1D(min, max);
}

export function span2d(
    minX = 0, maxX = 1,
    minY = 0, maxY = 1
): Span2D {
    return Span2D.fromBounds(minX, maxX, minY, maxY);
}

export function span2dFromSpans(
    x: Span1D = new Span1D(),
    y: Span1D = new Span1D()
): Span2D {
    return new Span2D(x, y);
}

const UNIT_SPAN1 = new Span1D(0, 1);
const UNIT_SPAN2 = new Span2D(UNIT_SPAN1, UNIT_SPAN1);
