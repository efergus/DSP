import { complex, complex_add, complex_conjugate, complex_div, complex_mul, complex_mul_scalar, complex_norm, complex_phase, complex_polar, complex_sub, complex_to_real, type Complex } from "./complex";
import { polynomial_with_roots } from "./filter";

export function addConjugates(roots: Complex[]) {
    return roots.flatMap(x => Math.abs(x.im) > 1e-12 ? [x, complex_conjugate(x)] : [complex(x.re, 0)])
}

export function coefficients(roots: Complex[]) {
    return polynomial_with_roots(roots);
}

export function realCoefficients(roots: Complex[]): number[] {
    return coefficients(roots).map(complex_to_real);
}

export class Iir {
    declare _forward: number[];
    declare _back: number[];
    declare _state: number[];
    declare zeros: Complex[];
    declare poles: Complex[];
    declare gain: number;

    constructor(zeros: Complex[] = [], poles: Complex[] = []) {
        this._forward = [1];
        this._back = [1];
        this.zeros = zeros;
        this.poles = poles;
        this.gain = 1;

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
        this._forward = coefficients(this.zeros).map(complex_to_real);
        this._back = coefficients(this.poles).map(complex_to_real);
    }

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
}