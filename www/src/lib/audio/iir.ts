import { complex, complex_add, complex_conjugate, complex_dist, complex_div, complex_mul, complex_mul_scalar, complex_norm, complex_phase, complex_polar, complex_sub, complex_to_real, type Complex } from "../dsp/complex";
import { polynomial_with_roots, s2z_bilinear } from "./filter";
import type { NumArr } from "./sample";

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

export function coefficients(roots: Complex[]) {
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
    declare gain: number;

    constructor(zeros: Complex[] = [], poles: Complex[] = [], gain = 1) {
        this._forward = new Float32Array([1]);
        this._back = new Float32Array([1]);
        this.zeros = zeros;
        this.poles = poles;
        this.gain = gain;

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
        this._back.set(coefficients(this.poles).map(complex_to_real));
        this._forward.set(coefficients(this.zeros).map((val) => complex_to_real(val) * this.gain / this._back[0]));
    }

    // TODO rename these response functions
    response(freq: number): Complex {
        let z = complex_polar(2 * Math.PI * freq);

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

    response_norm(freq: number): number {
        let response_complex = this.response(freq);
        return complex_norm(response_complex);
    }

    response_phase(freq: number): number {
        let response_complex = this.response(freq);
        return complex_phase(response_complex);
    }

    order(): number {
        return Math.max(this.zeros.length, this.poles.length);
    }
}

export type ApplyIirOptions = {
    inputStart?: number;
    outputStart?: number;
}

export class IirDigital extends Iir {
    constructor(zeros: Complex[] = [], poles: Complex[] = [], gain = 1) {
        super(zeros, poles, gain);
    }

    apply(input: NumArr, pastInput?: NumArr, pastOutput?: NumArr): Float32Array {
        const N = this.order() + 1;
        pastOutput = pastOutput ?? new Float32Array(0);
        pastInput = pastInput ?? new Float32Array(0);
        const output = new Float32Array(input.length);
        for (let idx = 0; idx < input.length; idx++) {
            let y = 0;
            for (let delay = 0; delay < N && delay <= pastInput.length + idx; delay++) {
                if (delay > idx) {
                    y += pastInput[pastInput.length + idx - delay] * this._forward[delay];
                }
                else {
                    y += input[idx - delay] * this._forward[delay];
                }
            }
            y *= this.gain;
            for (let delay = 1; delay < N && delay <= pastOutput.length + idx; delay++) {
                if (delay > idx) {
                    y -= pastOutput[pastOutput.length + idx - delay] * this._back[delay]
                }
                else {
                    y -= output[idx - delay] * this._back[delay];
                }
            }
            output[idx] = y;
        }
        return output;
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

        const filter = new IirDigital(zeros, poles);
        const target_response = filter.response_norm(freq);
        const our_response = this.freq_response(freq);
        filter.gain = our_response / target_response;
        filter._calculateCoefficients();
        // console.log("gains", dc_response, filter.gain, this.gain)

        return filter;
    }

    freq_response(freq: number): number {
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