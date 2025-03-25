import { complex, type Complex } from "$lib/dsp/complex";

export class Point {
    constructor(public x: number = 0, public y: number = 0) { }

    copy(): Point {
        return new Point(this.x, this.y);
    }

    toComplex(): Complex {
        return complex(this.x, this.y);
    }

    fromComplex(complex: Complex): void {
        this.x = complex.re;
        this.y = complex.im;
    }
}

export function point(x = 0, y = 0): Point {
    return new Point(x, y);
}