
export function isClose(a: number, b: number, epsilon = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}

export function sigFigs(value: number, precision = 3): string {
    if (!value) {
        return '0';
    }
    const magnitude = Math.floor(Math.log10(Math.abs(value)));
    if (magnitude >= precision) {
        const integer = Math.round(value / 10 ** (magnitude - precision));
        if (magnitude === precision) {
            return `${integer}`;
        }
        return `${integer}${'0'.repeat(magnitude - precision)}`;
    }
    return value.toFixed(precision - magnitude - 1);
}