import { SampleData, SampleSlice, SampleView, type NumArr, type Sample } from "$lib/audio/sample";
import type { P } from "vitest/dist/chunks/environment.d8YfPkTm.js";
import { complex, complex_add, complex_conjugate, complex_dist, complex_div, complex_mul, complex_mul_scalar, complex_norm, complex_norm2, complex_phase, complex_phase_2, complex_polar, complex_sub, complex_to_real, type Complex } from "./complex";

export const ZERO_STATE = -1;
export const POLE_STATE = 1;

export type Root = {
    degree: number;
    val: Complex;
}

export type OldRoot = {
    state: number;
    count: number;
    val: Complex;
};

export function addConjugates(roots: Complex[]) {
    return roots.flatMap(x => Math.abs(x.im) > 1e-12 ? [x, complex_conjugate(x)] : [complex(x.re, 0)])
}

export function removeConjugates(roots: Complex[], threshold = 1e-12) {
    const slice = roots.slice();
    slice.sort((a, b) => a.re - b.re || a.im - b.im);
    const filtered = [];
    for (let idx = 0; idx < slice.length - 1; idx++) {
        filtered.push(slice[idx]);
        if (slice[idx].im + slice[idx + 1].im <= threshold) {
            idx++;
        }
    }
}

export function coefficients(roots: Complex[]): Complex[] {
    return polynomial_with_roots(roots);
}

export function realCoefficients(roots: Complex[]): number[] {
    return coefficients(roots).map(complex_to_real);
}

export class Iir {
    declare _forward: Float32Array;
    declare _back: Float32Array;
    declare _state: number[];
    declare zeros: Complex[];
    declare poles: Complex[];
    declare _gain: number;

    constructor(zeros: Complex[] = [], poles: Complex[] = [], gain = 1) {
        this._forward = new Float32Array([1]);
        this._back = new Float32Array([1]);
        this.zeros = zeros;
        this.poles = poles;
        this._gain = gain;

        this._calculateCoefficients();
    }

    setZeros(zeros: Complex[]) {
        this.zeros = zeros;
        this._calculateCoefficients();
    }

    setPoles(poles: Complex[]) {
        this.poles = poles;
        this._calculateCoefficients();
    }

    _calculateCoefficients() {
        const N = this.order() + 1;
        this._forward = new Float32Array(N);
        this._back = new Float32Array(N);
        // this._forward = coefficients(this.zeros).map((val) => complex_to_real(val) * this.gain);
        // this._back = coefficients(this.poles).map(complex_to_real);
        const back = coefficients(this.poles).map(complex_to_real)
        this._back.set(back.map((val) => val / back[0]));
        this._forward.set(coefficients(this.zeros).map((val) => complex_to_real(val) * this.gain / back[0]));
    }

    order(): number {
        return Math.max(this.zeros.length, this.poles.length);
    }

    get gain(): number {
        return this._gain;
    }

    set gain(value: number) {
        this._gain = value;
        this._calculateCoefficients();
    }

    rawCoefficients(): Float32Array {
        const size = Math.max(this._forward.length, this._back.length);
        const coefficients = new Float32Array(size * 2);
        coefficients.set(this._forward);
        coefficients.set(this._back, size);
        return coefficients;
    }

    // response(zValue: Complex): Complex {
    //     let numerator = complex(0);
    //     for (let i = 0; i < this._forward.length; i++) {
    //         let z_inv_i = complex_polar(-2 * Math.PI * freq * i)
    //         numerator = complex_add(numerator, complex_mul_scalar(z_inv_i, this._forward[i]));
    //     }

    //     let denominator = complex(0);
    //     for (let i = 0; i < this._back.length; i++) {
    //         let z_inv_i = complex_polar(-2 * Math.PI * freq * i)
    //         denominator = complex_add(denominator, complex_mul_scalar(z_inv_i, this._back[i]));
    //     }

    //     return complex_div(numerator, denominator);
    // }
}

export type ApplyIirOptions = {
    inputStart?: number;
    outputStart?: number;
}

export class IirDigital extends Iir {
    constructor(zeros: Complex[] = [], poles: Complex[] = [], gain = 1) {
        super(zeros, poles, gain);
    }

    static from_roots(roots: OldRoot[], gain = 1) {
        return new IirDigital(
            addConjugates(roots.filter(({ state }) => state === ZERO_STATE).map(({ val }) => val)),
            addConjugates(roots.filter(({ state }) => state === POLE_STATE).map(({ val }) => val)),
            gain
        );
    }

    apply(input: NumArr | Sample, pastInput?: NumArr | Sample, pastOutput?: NumArr | Sample, outputBuffer?: Float32Array): Float32Array {
        const inputView = new SampleView(input);
        const pastInputView = new SampleView(pastInput ?? null);
        const pastOutputView = new SampleView(pastOutput ?? null);
        const N = this.order() + 1;
        if (outputBuffer && outputBuffer.length < inputView.length) {
            throw new Error(`Output buffer shorter than input buffer (${outputBuffer.length} < ${inputView.length})`)
        }
        const output = outputBuffer ?? new Float32Array(inputView.length);
        for (let idx = 0; idx < input.length; idx++) {
            let y = 0;
            for (let delay = 0; delay < N && delay <= pastInputView.length + idx; delay++) {
                if (delay > idx) {
                    y += pastInputView.get(pastInputView.length + idx - delay) * this._forward[delay];
                }
                else {
                    y += inputView.get(idx - delay) * this._forward[delay];
                }
            }
            // y *= this.gain;
            for (let delay = 1; delay < N && delay <= pastOutputView.length + idx; delay++) {
                if (delay > idx) {
                    y -= pastOutputView.get(pastOutputView.length + idx - delay) * this._back[delay]
                }
                else {
                    y -= output[idx - delay] * this._back[delay];
                }
            }
            output[idx] = y;
        }
        return output;
    }

    frequency_response(freq: number): Complex {
        let numerator = complex(0);
        for (let i = 0; i < this._forward.length; i++) {
            let z_inv_i = complex_polar(-2 * Math.PI * freq * i)
            numerator = complex_add(numerator, complex_mul_scalar(z_inv_i, this._forward[i]));
        }

        let denominator = complex(0);
        for (let i = 0; i < this._back.length; i++) {
            let z_inv_i = complex_polar(-2 * Math.PI * freq * i)
            denominator = complex_add(denominator, complex_mul_scalar(z_inv_i, this._back[i]));
        }

        return complex_div(numerator, denominator);
    }

    // use quotient rule (f/g)' = (f'g-fg')/(g^2)
    // frequency_response_derivative(freq: number): Complex {

    // }

    frequency_response_norm(freq: number): number {
        let response_complex = this.frequency_response(freq);
        return complex_norm(response_complex);
    }

    frequency_response_norm_2(freq: number): number {
        let numerator = 1;
        let point = complex_polar(freq * Math.PI);
        for (let i = 0; i < this.zeros.length; i++) {
            numerator *= complex_dist(this.zeros[i], point);
        }

        let denominator = 1;
        for (let i = 0; i < this.poles.length; i++) {
            denominator *= complex_dist(this.poles[i], point);
        }

        return numerator / denominator * this.gain;
    }

    frequency_response_norm_derivative_approx(freq: number, h = 1e-4): number {
        const f1 = this.frequency_response_norm(freq + h);
        const f2 = this.frequency_response_norm(freq - h);
        return (f1 - f2) / (2 * h);
    }

    /**
     * Finds the frequency with maximum frequency response using gradient ascent optimization.
     * 
     * This method uses gradient ascent to climb towards a local maximum, then refines the result
     * using binary search once the gradient becomes small or unstable.
     * 
     * @param start_freq - The initial frequency to start the gradient ascent from
     * @param h - The step size used for both gradient approximation and optimization (default: 1e-4)
     * @param max_iter - Maximum number of gradient ascent iterations to perform (default: 100)
     * @returns The frequency with locally maximum frequency response magnitude
     */
    max_frequency_response_gradient_ascent(start_freq: number, h = 1e-4, max_iter = 100): number {
        let freq = start_freq;
        for (let iter = 0; iter < max_iter; iter++) {
            let df = this.frequency_response_norm_derivative_approx(freq, h);
            let new_freq = freq + df * h;
            if (this.frequency_response_norm(new_freq) > this.frequency_response_norm(freq)) {
                freq = new_freq;
            }
            else {
                return this.max_frequency_response_bisection(freq - h, freq + h, max_iter);
            }
        }
        return freq;
    }

    /**
     * Finds the frequency with maximum frequency response within a given range using binary search.
     * 
     * @param start_freq - The lower bound of the frequency range to search
     * @param end_freq - The upper bound of the frequency range to search  
     * @param max_iter - Maximum number of binary search iterations to perform
     * @returns The frequency with the highest frequency response magnitude found
     */
    max_frequency_response_bisection(start_freq: number, end_freq: number, max_iter = 100): number {
        let low = start_freq;
        let high = end_freq;
        let mid = (low + high) / 2;
        for (let iter = 0; iter < max_iter && low < high; iter++) {
            if (this.frequency_response_norm(mid) > this.frequency_response_norm(low)) {
                low = mid;
            }
            else {
                high = mid;
            }
        }
        return mid;
    }

    /**
     * Finds the frequency with maximum frequency response within a given range using sensible defaults.
     * 
     * Note: Not guaranteed to find the global maximum or to be the most efficient method.
     */
    max_frequency_response(): number {
        const samples = (this.order() + 4) * 4;
        let max_freq = 0;
        let max_response = 0;
        for (let idx = 0; idx < samples; idx++) {
            const freq = idx / samples / 2;
            const response = this.frequency_response_norm(freq);
            if (response > max_response) {
                max_response = response;
                max_freq = freq;
            }
        }
        for (let idx = 0; idx < this.zeros.length; idx++) {
            if (this.zeros[idx].im <= 0) {
                continue;
            }
            const freq = complex_phase(this.zeros[idx]) / Math.PI / 2;
            if (this.frequency_response_norm(freq) > max_response) {
                max_response = this.frequency_response_norm(freq);
                max_freq = freq;
            }
        }
        for (let idx = 0; idx < this.poles.length; idx++) {
            if (this.poles[idx].im <= 0) {
                continue;
            }
            const freq = complex_phase(this.poles[idx]) / Math.PI / 2;
            if (this.frequency_response_norm(freq) > max_response) {
                max_response = this.frequency_response_norm(freq);
                max_freq = freq;
            }
        }
        return this.max_frequency_response_gradient_ascent(max_freq);
    }

    frequency_response_phase(freq: number): number {
        let acc = freq * (this.poles.length - this.zeros.length);
        let point = complex_polar(freq * Math.PI * 2);
        let one = complex(1, 0);
        const angle = (target: Complex) => {
            const toPoint = complex_sub(point, target);
            const toOne = complex_sub(one, target);
            const rotated = complex_mul(toPoint, complex_conjugate(toOne));
            const angle = complex_phase_2(rotated);
            const startAngle = complex_phase(toOne);
            return angle + startAngle;
        }
        for (let i = 0; i < this.zeros.length; i++) {
            acc += angle(this.zeros[i]);
        }

        for (let i = 0; i < this.poles.length; i++) {
            acc -= angle(this.poles[i]);
        }

        return acc;
    }

    frequency_response_phase_2(freq: number): number {
        let response_complex = this.frequency_response(freq);
        return complex_phase(response_complex);
    }
}

export class IirContinuous extends Iir {
    constructor(zeros: Complex[] = [], poles: Complex[] = [], gain = 1) {
        super(zeros, poles, gain);
    }

    to_digital_bilinear(freq: number = 0): IirDigital {
        const bilinear = (root: Complex) => s2z_bilinear(root, 1, freq)
        const N = Math.max(this.zeros.length, this.poles.length);
        const transformed_zeros = this.zeros.map(bilinear);
        const transformed_poles = this.poles.map(bilinear);

        let zeros = transformed_zeros.concat(new Array(N - this.zeros.length).fill(complex(-1)));
        let poles = transformed_poles.concat(new Array(N - this.poles.length).fill(complex(-1)));

        const filter = new IirDigital(zeros, poles, this.gain);
        // const target_response = filter.response_norm(freq);
        // const our_response = this.freq_response(freq);
        // filter.gain = our_response / target_response;
        // filter._calculateCoefficients();
        // console.log("gains", dc_response, filter.gain, this.gain)

        return filter;
    }

    frequency_response_norm(freq: number): number {
        let numerator = 1;
        let point = complex(0, freq);
        for (let i = 0; i < this.zeros.length; i++) {
            numerator *= complex_dist(this.zeros[i], point);
        }

        let denominator = 1;
        for (let i = 0; i < this.poles.length; i++) {
            denominator *= complex_dist(this.poles[i], point);
        }

        return numerator / denominator * this.gain;
    }
}

export function butterworth(freq: number, order = 2) {
    const gain = freq ** order;
    let poles = [];
    for (let k = 1; k <= order; k++) {
        poles.push(complex_polar((2 * k + order - 1) * Math.PI / (2 * order), freq));
        // if (Math.abs(poles[k - 1].im) < 1e-9) {
        //     poles[k - 1].im = 0;
        // }
    }
    return new IirContinuous([], poles, gain);
}

export function single_pole_bandstop(freq: number, width: number) {
    return new IirDigital(addConjugates([complex_polar(freq, 1)]), addConjugates([complex_polar(freq, 1 - width)]))
}

export function single_pole_bandpass(freq: number, width: number) {
    return new IirDigital(addConjugates([complex_polar(freq, 0.95 - width)]), addConjugates([complex_polar(freq, 0.95)]))
}

export function filterRoots(filter: IirDigital): OldRoot[] {
    return filter.zeros
        .map((val) => ({
            state: ZERO_STATE,
            count: 1,
            val
        }))
        .concat(
            filter.poles.map((val) => ({
                state: POLE_STATE,
                count: 1,
                val
            }))
        )
        .filter((root) => root.val.im >= 0);
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

type Polynomial<T = number> = T[];

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