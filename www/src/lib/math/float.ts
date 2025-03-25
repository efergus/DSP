
export function isClose(a: number, b: number, epsilon = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}