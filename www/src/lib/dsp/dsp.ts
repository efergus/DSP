// const rust_dsp = import("sound");

// export async function dsp_greet() {
//     return (await rust_dsp).greet();
// }

import { greet } from "sound";
import { FftContext } from "sound";
// export { FftContext } from "sound";

export function dsp_greet() {
    return greet();
}

export function context() {
    return FftContext.new();
}