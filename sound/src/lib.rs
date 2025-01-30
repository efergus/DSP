mod utils;

use std::collections::HashMap;

use realfft::RealFftPlanner;
use rustfft::num_complex::Complex;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    String::from("Hello, sound!")
}

#[wasm_bindgen]
pub struct FftContext {
    planner: RealFftPlanner<f32>,
}

#[wasm_bindgen]
impl FftContext {
    pub fn new() -> Self {
        FftContext {
            planner: RealFftPlanner::new(),
        }
    }

    pub fn fft(&mut self, mut signal: std::vec::Vec<f32>) -> std::vec::Vec<f32> {
        let plan = self.planner.plan_fft_forward(signal.len());
        let mut output = plan.make_output_vec();
        plan.process(&mut signal, &mut output).expect("FFT failed");
        let mut result = std::vec::Vec::with_capacity(output.len() * 2);
        for num in output {
            result.push(num.re);
            result.push(num.im);
        }
        result
    }

    pub fn fft_norm(&mut self, mut signal: std::vec::Vec<f32>) -> std::vec::Vec<f32> {
        let plan = self.planner.plan_fft_forward(signal.len());
        let mut output = plan.make_output_vec();
        plan.process(&mut signal, &mut output).expect("FFT failed");
        let mut result = std::vec::Vec::with_capacity(output.len());
        for num in output {
            result.push(num.norm());
        }
        result
    }

    pub fn fft_peak(&mut self, signal: std::vec::Vec<f32>) -> usize {
        let result = self.fft_norm(signal);
        let mut peak: f32 = 0.0;
        let mut peak_idx: usize = 0;

        for (i, val) in result.iter().enumerate() {
            if (*val > peak) {
                peak = *val;
                peak_idx = i;
            }
        }

        peak_idx
    }

    pub fn fft_inverse(&mut self, spectrum: std::vec::Vec<f32>) -> std::vec::Vec<f32> {
        let plan = self.planner.plan_fft_inverse((spectrum.len() - 1) * 2);
        let mut input = plan.make_input_vec();
        let mut output = plan.make_output_vec();
        for idx in 0..spectrum.len() / 2 {
            input[idx] = Complex::new(spectrum[idx * 2], spectrum[idx * 2 + 1]);
        }
        plan.process(&mut input, &mut output)
            .expect("Inverse FFT failed");
        return output;
    }
}

#[wasm_bindgen]
pub fn planner() -> FftContext {
    FftContext::new()
}
