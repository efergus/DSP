import { complex, complex_add, complex_div, complex_mul, complex_mul_scalar, complex_norm2, complex_polar, complex_sub, type Complex } from "../dsp/complex";
import { realCoefficients } from "./iir";
import type { NumArr } from "./sample";

type IIRFilter = {
    forward: number[];
    back: number[];
    gain: number;
}

type Polynomial<T = number> = T[];
export function filter_from_coefficients(forward: number[], back: number[], gain: number) {
    let scale = (gain: number) => (x: number) => x * gain;
    return {
        forward: forward.map(scale(gain / back[0])),
        back: back.map(scale(1 / back[0])),
        gain: 1
    }
}

function convolve_generic<T, U = T>(a: T[], b: T[], add: (a: U, b: U) => U, mul: (a: T, b: T) => U) {
    let res = new Array(a.length + b.length - 1).fill(null);

    for (let o_idx = 0; o_idx < res.length; o_idx++) {
        for (let k_idx = Math.max(o_idx - a.length + 1, 0); k_idx <= o_idx && k_idx < b.length; k_idx++) {
            let val = mul(a[o_idx - k_idx], b[k_idx]);
            if (res[o_idx] !== null) {
                val = add(res[o_idx], val);
            }
            res[o_idx] = val;
        }
    }
    return res;
}

// polynomial multiplication is a convolution
// that also means the order of the arrays (high or low degree first)
// does not matter as long as it is consistent
// Explanation:
// (x + 0) * (x + 2) => (x^2 + 2x + 0)
// [1, 0] & [1, 2] => (1, 2, 0)
// i.e. x (shiftted impulse) convolved with data shifts the data
export function mul_polynomials(a: Polynomial, b: Polynomial) {
    return convolve_generic(a, b, (a, b) => a + b, (a, b) => a * b);
}

export function mul_complex_polynomials(a: Polynomial<Complex>, b: Polynomial<Complex>) {
    return convolve_generic(a, b, complex_add, complex_mul);
}

export function polynomial_with_conjugate_roots(complex_roots: Complex[], real_roots: number[] = []) {
    let reals = real_roots.map((x) => [1, -x]).concat(complex_roots.map((x) => [1, -2 * x.re, complex_norm2(x)]));
    let res = reals.reduce((acc, val) => {
        const res = mul_polynomials(acc, val);
        // console.log(acc, val, res);
        return res;
    }, [1]);
    return res;
}

export function polynomial_with_roots(roots: Complex[]) {
    // (x - root1)*(x - root2)...
    let parts = roots.map((root) => [complex(1), complex_mul_scalar(root, -1)]);
    let res = parts.reduce((acc, val) => {
        const res = mul_complex_polynomials(acc, val);
        return res;
    }, [complex(1)]);
    return res;
}

// export function polynomial_with_roots(roots: Complex[]) {

// }

function notch_intermediate(freq: number, bw: number) {
    let r = 1 - 3 * bw;
    let ang = 2 * Math.PI * freq;
    let x = Math.cos(ang);
    return {
        k: (1 - 2 * r * x + r * r) / (2 - 2 * x),
        r,
        ang
    }
}

export function single_pole_low_pass(x: number) {
    return {
        forward: [1 - x],
        back: [x],
        gain: 1
    }
}

export function single_pole_high_pass(x: number) {
    return {
        forward: [(1 + x) / 2, -(1 + x) / 2],
        back: [x],
        gain: 1
    }
}

export function notch_pass_filter(freq: number, bw = 2 ** -5) {
    const { k, r, ang } = notch_intermediate(freq, bw);
    return {
        forward: [1 - k, 2 * (k - r) * Math.cos(ang), r * r - k],
        back: [2 * r * Math.cos(ang), - r * r],
        gain: 1
    }
}

export function notch_reject_filter(freq: number, bw = 2 ** -5) {
    const { k, r, ang } = notch_intermediate(freq, bw);
    return {
        forward: [k, -2 * k * Math.cos(ang), k],
        back: [2 * r * Math.cos(ang), - r * r],
        gain: 1
    }
}

export function angular_biquad_filter(zero_freq: number, zero_radius: number, pole_freq: number, pole_radius: number) {
    const zero = complex(
        Math.cos(2 * Math.PI * zero_freq) * zero_radius,
        Math.sin(2 * Math.PI * zero_freq) * zero_radius
    );
    const pole = complex(
        Math.cos(2 * Math.PI * pole_freq) * pole_radius,
        Math.sin(2 * Math.PI * pole_freq) * pole_radius
    );
    // console.log("ra", zero_radius, pole_radius);
    let zero_polynomial = polynomial_with_conjugate_roots([zero]);
    let pole_polynomial = polynomial_with_conjugate_roots([pole]);
    let filter = {
        forward: zero_polynomial,
        back: pole_polynomial.slice(1),
        gain: 1
    }
    return filter;
}

export function example_filter_values() {
    let zeros = new Array(3).fill(0).map((_, i) => complex_polar(Math.PI * 2 * i / 3, -0.5));
    let poles = new Array(5).fill(0).map((_, i) => complex_polar(Math.PI * 2 * i / 5, -0.9));
    return { zeros, poles };
}

export function iir_filter(zeros: Complex[], poles: Complex[], gain = 1) {
    let forward = realCoefficients(zeros);
    let back = realCoefficients(poles);
    return filter_from_coefficients(forward, back, gain);
}

export function apply_iir(filter: IIRFilter, input: NumArr, output: NumArr): number {
    let y = 0;
    for (let i = 0; i < Math.min(filter.forward.length, input.length); i++) {
        y += input[input.length - 1 - i] * filter.forward[i] * filter.gain;
    }
    for (let i = 1; i < filter.back.length && i <= output.length; i++) {
        y -= output[output.length - i] * filter.back[i];
    }
    return y;
}

export function s2z_bilinear(s: Complex, T = 1, freq = 0) {
    let coeffecient = freq > 0 ? Math.tan(freq * T / 2) / freq : T / 2;
    return complex_div(
        complex_add(complex(1), complex_mul_scalar(s, coeffecient)),
        complex_sub(complex(1), complex_mul_scalar(s, coeffecient))
    )
}

export function z2s_bilinear(z: Complex, T = 1, freq = 0) {
    let coeffecient = freq > 0 ? freq / Math.tan(freq * T / 2) : 2 / T;
    return complex_mul_scalar(complex_div(
        complex_sub(z, complex(1)),
        complex_add(z, complex(1))
    ), coeffecient)
}