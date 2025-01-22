import { json } from "@sveltejs/kit";

export type Complex = {
    re: number;
    im: number;
};


export function complex(re: number = 0, im: number = 0) {
    return { re, im };
}

export function complex_polar(angle: number, radius: number = 1) {
    // console.log(radius, angle);
    return {
        re: Math.cos(angle) * radius,
        im: Math.sin(angle) * radius
    }
}

export function complex_add(a: Complex, b: Complex) {
    return { re: a.re + b.re, im: a.im + b.im }
}

export function complex_sub(a: Complex, b: Complex) {
    return { re: a.re - b.re, im: a.im - b.im }
}

export function complex_mul(a: Complex, b: Complex) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

export function complex_mul_scalar(a: Complex, scalar: number) {
    return { re: a.re * scalar, im: a.im * scalar }
}

export function complex_div(a: Complex, b: Complex) {
    let norm = complex_norm2(b);
    return {
        re: (a.re * b.re + a.im * b.im) / norm,
        im: (a.im * b.re - a.re * b.im) / norm
    }
}

export function complex_conjugate(val: Complex) {
    return { re: val.re, im: -val.im }
}

export function complex_norm(val: Complex) {
    return Math.sqrt(val.re ** 2 + val.im ** 2);
}

export function complex_norm2(val: Complex) {
    return val.re ** 2 + val.im ** 2;
}

export function complex_phase(val: Complex) {
    return Math.atan2(val.im, val.re);
}

export function complex_to_real(val: Complex) {
    if (Math.abs(val.im) / Math.max(Math.abs(val.re), 1e-4) > 1e-6) {
        throw new Error(`Cannot convert number with significant imaginary component to real ${JSON.stringify(val)}`)
    }
    if (Math.abs(val.re) < 1e-14) {
        return 0;
    }
    return val.re;
}