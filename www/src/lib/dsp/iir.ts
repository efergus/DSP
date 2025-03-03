import { polynomial_with_roots, s2z_bilinear } from "$lib/audio/filter";
import { SampleData, SampleSlice, SampleView, type NumArr, type Sample } from "$lib/audio/sample";
import { complex, complex_add, complex_conjugate, complex_dist, complex_div, complex_mul_scalar, complex_norm, complex_phase, complex_polar, complex_to_real, type Complex } from "./complex";

export const ZERO_STATE = 0;
export const POLE_STATE = 1;
export const DEAD_STATE = 2;

export type Root = {
    state: number;
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

    static from_roots(roots: Root[], gain = 1) {
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
            y *= this.gain;
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

export function filterRoots(filter: IirDigital): Root[] {
    return filter.zeros
        .map((val) => ({
            state: 0,
            val
        }))
        .concat(
            filter.poles.map((val) => ({
                state: 1,
                val
            }))
        )
        .filter((root) => root.val.im >= 0);
}