
export class Point {
    constructor(public x: number = 0, public y: number = 0) {}

    copy(): Point {
        return new Point(this.x, this.y);
    }
}

export class Span1D {
    constructor(public min: number = 0, public max: number = 1) {}

    copy(): Span1D {
        return new Span1D(this.min, this.max);
    }

    move(x: number): Span1D {
        return new Span1D(this.min + x, this.max + x);
    }

    scale(scale: number, center?: number): Span1D {
        center = center ?? ((this.max + this.min) / 2);
        const d1 = this.min - center;
        const d2 = this.max - center;
        return new Span1D(center + d1 * scale, center + d2 * scale);
    }

    static intersect(span1: Span1D, span2: Span1D): Span1D {
        return new Span1D(
            Math.max(span1.min, span2.min),
            Math.min(span1.max, span2.max)
        );
    }

    intersect(span: Span1D): Span1D {
        return Span1D.intersect(this, span);
    }

    remap(value: number, to: Span1D): number {
        return to.min + (value - this.min) * (to.max - to.min) / (this.max - this.min);
    }
}

export class Span2D {
    constructor(
        public x: Span1D = new Span1D(),
        public y: Span1D = new Span1D()
    ) {}

    static fromBounds(minX = 0, maxX = 1, minY = 0, maxY = 1): Span2D {
        return new Span2D(
            new Span1D(minX, maxX),
            new Span1D(minY, maxY)
        );
    }

    move(x: number, y: number): Span2D {
        return new Span2D(
            this.x.move(x),
            this.y.move(y)
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

    remap(point: Point, to: Span2D): Point {
        return new Point(
            this.x.remap(point.x, to.x),
            this.y.remap(point.y, to.y)
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
    
}

export function point(x = 0, y = 0): Point {
    return new Point(x, y);
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
