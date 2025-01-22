import { test, expect } from "vitest";
import { mul_polynomials, polynomial_with_conjugate_roots } from "./filter";
import { complex } from "./complex";

// todo: test linearity, reversal, commutivity
test('polynomial multiplication', () => {
    expect(mul_polynomials([3, 2, 1], [1, 1])).toEqual([3, 5, 3, 1]);
    expect(mul_polynomials([1], [1])).toEqual([1]);
    expect(mul_polynomials([1], [1, 5])).toEqual([1, 5]);
    expect(mul_polynomials([1, 1], [1, 1])).toEqual([1, 2, 1]);
    expect(mul_polynomials([1, -4, 4], [1, -2, 1])).toEqual([1, -6, 13, -12, 4]);
    expect(mul_polynomials([4, -4, 1], [2, -4, 2])).toEqual([8, -24, 26, -12, 2]);
})

test('polynomial with conjugate roots', () => {
    expect(polynomial_with_conjugate_roots([complex(1, 0)])).toEqual([1, -2, 1]);
    expect(polynomial_with_conjugate_roots([complex(2, 0), complex(1, 0)])).toEqual([1, -6, 13, -12, 4]);
    expect(polynomial_with_conjugate_roots([], [2, 1])).toEqual([1, -3, 2]);
    expect(polynomial_with_conjugate_roots([complex(1, 1)])).toEqual([1, -2, 2]);
    expect(polynomial_with_conjugate_roots([complex(1, 1), complex(-2, 1)], [1])).toEqual([1, 1, -3, -1, 12, -10]);
})

