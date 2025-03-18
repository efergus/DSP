
export class Point {
    constructor(public x: number = 0, public y: number = 0) { }

    copy(): Point {
        return new Point(this.x, this.y);
    }
}