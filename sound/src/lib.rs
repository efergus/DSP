mod utils;

use realfft::RealFftPlanner;
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

    pub fn fft_real(&mut self, mut signal: std::vec::Vec<f32>) -> std::vec::Vec<f32> {
        let plan = self.planner.plan_fft_forward(signal.len());
        let mut output = plan.make_output_vec();
        plan.process(&mut signal, &mut output).expect("FFT failed");
        let mut result = std::vec::Vec::with_capacity(output.len());
        for num in output {
            result.push(num.norm());
        }
        result
    }
}

#[wasm_bindgen]
pub fn planner() -> FftContext {
    FftContext::new()
}
