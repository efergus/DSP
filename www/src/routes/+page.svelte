<script lang="ts">
	import { processor } from '$lib/audio/processor';
	import Circle from '$lib/icons/Circle.svelte';
	import PauseCircle from '$lib/icons/PauseCircle.svelte';
	import StopCircle from '$lib/icons/StopCircle.svelte';
	import { onMount } from 'svelte';
	import { context, dsp_greet } from '$lib/dsp/dsp';
	import { combine, draw_waveform } from '$lib/audio/draw';
	import { scale } from 'svelte/transition';
	import { read } from '$app/server';
	import Waveform from './Waveform.svelte';
	import Spectrum from './Spectrum.svelte';
	import { apply_hann_window, hann_windowed, pad_f32, rotated } from '$lib/audio/window';
	import Spectrogram from './Spectrogram.svelte';
	import { zero_crossing_median } from '$lib/audio/pitch';
	import {
		angular_biquad_filter,
		apply_iir,
		example_filter_values,
		iir_filter,
		notch_pass_filter,
		notch_reject_filter,
		single_pole_high_pass,
		single_pole_low_pass
	} from '$lib/audio/filter';
	import PoleZeroPlot from './PoleZeroPlot.svelte';
	import { complex, complex_norm, complex_polar } from '$lib/audio/complex';
	import {
		addConjugates,
		butterworth,
		Iir,
		IirDigital,
		single_pole_bandpass,
		single_pole_bandstop
	} from '$lib/audio/iir';
	import PoleZeroEditor, { type Root } from './PoleZeroEditor.svelte';
	import NoiseSpectrum from './NoiseSpectrum.svelte';

	let width = 400;
	let height = 200;

	let audio_data: AudioBuffer | null = $state(null);
	let audio_canvas: HTMLCanvasElement;
	let spectrum_canvas: HTMLCanvasElement;
	let audio_chunks: Float32Array[] = [];
	let state_old: {
		recording: boolean;
		paused: boolean;
		scrollX: number;
		scrollY: number;
		stream: MediaStream | null;
		context: AudioContext | null;
		node: AudioWorkletNode | null;
		gain: GainNode | null;
	} = {
		recording: false,
		paused: false,
		scrollX: 0,
		scrollY: 0,
		stream: null,
		context: null,
		node: null,
		gain: null
	};
	let port: MessagePort | null = $state(null);
	let fft_context = context();
	let fft_window = new Float32Array(1024 * 4);
	// size of an audio chunk (not configurable)
	const CHUNK_SIZE = 128;
	let scale_lin = $state({ x: 4.5, y: 0 });
	let offset = $state(0);
	let start_time = $state(0);
	let sample_idx = $state(0);
	let hann = $state(false);

	let draw_latest = (audio_chunks: Float32Array[]) => {
		if (!audio_chunks.length) {
			return;
		}
		const audio_context = audio_canvas.getContext('2d');
		const spectrum_context = spectrum_canvas.getContext('2d');
		if (!audio_context || !spectrum_context) {
			throw new Error('No context!');
		}

		audio_context.fillStyle = 'rgb(200 200 200)';
		audio_context.fillRect(0, 0, width, height);

		let latest = combine(audio_chunks.slice(-Math.floor(44100 / 128)));
		draw_waveform(audio_context, latest);

		combine(audio_chunks.slice(-fft_window.length / CHUNK_SIZE), fft_window);
		let result = fft_context.fft_norm(fft_window);

		spectrum_context.fillStyle = 'rgb(200 200 200)';
		spectrum_context.fillRect(0, 0, width, height);

		draw_waveform(spectrum_context, result.slice(0, 256), { scale: -1 });
	};

	let record = async () => {
		if (state_old.recording) {
			return;
		}
		state_old.recording = true;

		let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		audio_chunks = [];
		let audio_context = new AudioContext();
		const BUF_SIZE = 1024;

		let source = audio_context.createMediaStreamSource(stream);
		let analyser = audio_context.createAnalyser();
		let gain = new GainNode(audio_context, { gain: 0.0 });
		analyser.fftSize = BUF_SIZE;
		source.connect(analyser);

		await audio_context.audioWorklet.addModule(processor.url);

		let node = new AudioWorkletNode(audio_context, processor.name, {
			processorOptions: { test: 'test' }
		});
		port = node.port;
		source.connect(node);
		node.connect(gain);
		gain.connect(audio_context.destination);
		state_old.stream = stream;
		state_old.context = audio_context;
		state_old.node = node;
		state_old.gain = gain;

		node.port.onmessage = (e) => {
			if (state_old.recording && !state_old.paused) {
				audio_chunks.push(e.data);
				// console.log(e.data[0]);
			}
		};
		// node.port.postMessage({ filter: butter_digital });
		gain.gain.linearRampToValueAtTime(0.9, audio_context.currentTime + 0.5);
	};

	let play = async () => {
		if (!audio_data) {
			return;
		}
		// let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		let audio_context = new AudioContext();
		// let source = audio_context.createMediaStreamSource(stream);

		let buffer_node = audio_context.createBufferSource();
		buffer_node.buffer = audio_data;
		buffer_node.connect(audio_context.destination);
		buffer_node.start();

		let timer = (timestamp: DOMHighResTimeStamp) => {
			if (!start_time) {
				start_time = timestamp;
			} else {
				sample_idx = (timestamp - start_time) * 44.1;
			}
			requestAnimationFrame(timer);
		};
		requestAnimationFrame(timer);
	};

	let pause = async () => {
		if (!state_old.recording || !state_old.context) {
			return;
		}
		state_old.paused = !state_old.paused;
		let gain = state_old.paused ? 0.0 : 0.9;
		state_old.gain?.gain.linearRampToValueAtTime(gain, state_old.context.currentTime + 0.1);
	};

	let stop = async () => {
		state_old.stream?.getAudioTracks().forEach((track) => {
			track.enabled = false;
		});
		state_old.recording = false;
		state_old.paused = false;
	};

	let sma_filter = (data: Float32Array, window_size: number) => {
		let result = new Float32Array(data.length);
		for (let i = 0; i < data.length; i++) {
			let sum = 0;
			for (let j = i; j < i + window_size && j < data.length; j++) {
				sum += data[j];
			}
			result[i] = sum / window_size;
		}
		return result;
	};

	let sin_buffer = (freq = 440, samplerate = 44100) => {
		let res = new Float32Array(samplerate);
		for (let i = 0; i < res.length; i++) {
			// res[i] = Math.sin((2 * Math.PI * i * 4) / 1024);
			res[i] = Math.sin((2 * Math.PI * i * freq) / samplerate);
		}
		return res;
	};

	let chirp_buffer = (base_freq = 20, peak_freq = 1000, samplerate = 44100) => {
		let res = new Float32Array(samplerate * 6);
		let phase = 0;
		for (let i = 0; i < res.length; i++) {
			let current_freq =
				base_freq + (peak_freq - base_freq) * (1 - 0.5 * Math.sin((2 * Math.PI * i) / samplerate));
			res[i] = Math.sin(2 * Math.PI * phase);
			phase += current_freq / samplerate;
		}
		return res;
	};

	let load_sin = () => {
		// let buffer = sin_buffer();
		let buffer = chirp_buffer();
		let data = new AudioBuffer({ length: buffer.length, sampleRate: 44100 });
		data.copyToChannel(buffer, 0);
		audio_data = data;
	};

	onMount(() => {
		let draw_loop = () => {
			draw_latest(audio_chunks);
			requestAnimationFrame(draw_loop);
		};
		draw_loop();
	});

	let audio_raw = $derived.by(() => {
		return audio_data?.getChannelData(0);
	});

	let fft_peaks = $derived.by(() => {
		if (!audio_raw) {
			return [];
		}
		let i = 0;
		let peaks = [];
		while (i < audio_raw.length - 256) {
			let windowed = hann_windowed(audio_raw.slice(i, i + 256), 1024);
			let peak = fft_context.fft_peak(windowed);
			peaks.push(peak / 512);
			i += 128;
		}
		return peaks;
	});

	let crossing_pitches = $derived.by(() => {
		if (!audio_raw) {
			return [];
		}
		let pitches = [];
		for (let i = 0; i < audio_raw.length - 512; i += 256) {
			let crossing_distance = zero_crossing_median(audio_raw.slice(i, i + 512));
			if (!crossing_distance) {
				continue;
			}
			let freq = 1 / (crossing_distance * 2);
			pitches.push(freq);
			// console.log(freq);
		}
		return pitches;
	});

	let range_value = $state('0.5');
	let range_value2 = $state('0.5');
	let freq = $derived(Number(range_value) || 440 / 44100);
	let bw = $derived(Number(range_value2) / 10 || 1 / 32);
	let whatever = $derived(Number(range_value) || 0.0);
	let whatever2 = $derived(Number(range_value2) || 0.0);
	const butter_filter = $derived(butterworth(whatever, Math.floor(whatever2 * 5) + 1));
	// const butter_digital = $derived(butter_filter.to_digital_bilinear(0.2));
	const butter_digital = $derived(single_pole_bandpass(whatever, whatever2));
	$effect(() => {
		port?.postMessage({ filter: butter_digital });
	});
	// const butter_digital = $derived(single_pole_notch(whatever, whatever2));
	let roots: Root[] = $state([]);
	$effect(() => {
		roots = butter_digital.zeros
			.map((val) => ({
				state: 0,
				val
			}))
			.concat(
				butter_digital.poles.map((val) => ({
					state: 1,
					val
				}))
			)
			.filter((root) => root.val.im >= 0);
	});
	let zeros = $state([complex(0, 0)]);
	let poles = $state([complex(0, 0)]);
	// let { zeros, poles } = example_filter_values();
	let filter = $derived(new IirDigital(zeros, poles, butter_digital.gain));
	let response = $derived.by(() => {
		let points = 200;
		let arr = new Float32Array(points);
		for (let i = 0; i < points; i++) {
			arr[i] = filter.response_norm(i / points / 2);
		}
		return arr;
	});
	let continuous_response = $derived.by(() => {
		let points = 200;
		let arr = new Float32Array(points);
		for (let i = 0; i < points; i++) {
			arr[i] = butter_filter.freq_response((i / points) * Math.PI);
		}
		return arr;
	});
	let response_phase = $derived.by(() => {
		let arr = new Float32Array(100);
		for (let i = 0; i < 100; i++) {
			arr[i] = filter.response_phase(i / 200);
		}
		return arr;
	});
	let response_magnitude = $derived(response.reduce((a, b) => Math.max(a, b)));
	$inspect({ response_magnitude });

	let filter_impulse1 = $derived.by(() => {
		let filter = iir_filter(zeros, poles, butter_digital.gain);
		let data = new Float32Array(256);
		data[0] = 1.0;
		let output = new Float32Array(256);
		for (let i = 0; i < data.length; i++) {
			output[i] = apply_iir(filter, data.slice(0, i + 1), output.slice(0, i));
		}
		return output;
	});
	let filter_impulse2 = $derived.by(() => {
		let data = new Float32Array(256);
		data[0] = 1.0;
		let output = butter_digital.apply(data);
		// console.log(output);
		return output;
	});

	let half_step_down = $derived.by(() => {
		let arr = new Float32Array(257);
		for (let idx = 0; idx < (arr.length * whatever) / 2; idx += 2) {
			arr[idx] = 1.0;
		}
		return arr;
	});

	let half_step_down_inverse = $derived(fft_context.fft_inverse(half_step_down));
	let convolution_size = $derived(Math.ceil(whatever2 * 200) + 1);
	let step_inverse_rotated = $derived(
		rotated(half_step_down_inverse, Math.ceil(convolution_size / 2)).slice(0, convolution_size)
	);
	// console.log(half_step_down_inverse);
	let half_step_down_windowed = $derived(hann_windowed(step_inverse_rotated));
	let half_step_down_windowed_fft = $derived(
		fft_context.fft_norm(pad_f32(half_step_down_windowed, 256))
	);

	let notch_freq = $derived.by(() => {
		let result = fft_context.fft_norm(filter_impulse1);
		return result;
	});

	let fft_spectrogram = $derived.by(() => {
		if (!audio_data) {
			return [];
		}
		let data = audio_data.getChannelData(0);
		let i = 0;
		let spectrogram = [];
		while (i < data.length - 256) {
			let windowed = hann_windowed(data.slice(i, i + 256), 1024);
			let fft = fft_context.fft_norm(windowed);
			spectrogram.push(fft);
			i += 128;
		}
		return spectrogram;
	});
</script>

<div id="rootdiv">
	<div
		onwheel={(e) => {
			state_old.scrollX += e.deltaX;
			state_old.scrollY += e.deltaY;
		}}
	>
		<canvas bind:this={audio_canvas} {width} {height}></canvas>
		<canvas bind:this={spectrum_canvas} {width} {height}></canvas>
		<div>
			<NoiseSpectrum {filter} />
		</div>
		<Waveform data={filter_impulse1} limit={10000} scale={1} />
		<Waveform data={filter_impulse2} limit={10000} scale={1} />
		<Spectrum data={filter_impulse1} size={256} scale={0.9} />
		<Spectrum data={filter_impulse2} size={256} scale={0.9} />
		<PoleZeroEditor
			bind:roots
			conjugate
			onchange={(z, p) => {
				zeros = z;
				poles = p;
			}}
		/>
		<Waveform data={response} scale={0.9 / response_magnitude} />
		<Waveform data={continuous_response} scale={0.9} />
		<Waveform data={response_phase} scale={0.3} />
		<!-- <p>Windowing</p>
		<Waveform data={half_step_down} scale={0.3} />
		<Waveform data={half_step_down_inverse} scale={0.01} />
		<Waveform data={step_inverse_rotated} scale={0.01} />
		<Waveform data={half_step_down_windowed} scale={0.01} />
		<Waveform data={half_step_down_windowed_fft} scale={1 / 512} /> -->
		{#if audio_raw}
			<Waveform
				data={audio_raw}
				{offset}
				limit={10 ** scale_lin.x}
				scale={10 ** scale_lin.y}
				onwheel={({ x, y }, e) => {
					e.preventDefault();
					if (e.shiftKey) {
						scale_lin.y = Math.max(-0.4, Math.min(scale_lin.y + y / 500, 2));
					} else {
						scale_lin.x = Math.max(1, Math.min(scale_lin.x - y / 500, 8));
					}
					offset = Math.floor(Math.max(0, offset + (x / width / 2) * 10 ** scale_lin.x));
				}}
			/>
			<Spectrum
				data={audio_raw}
				{offset}
				size={256}
				span={1024}
				scale={0.5}
				pad={4096 * 4}
				{hann}
				onfft={(data) => {
					let peak = 0;
					let peak_idx = 0;
					for (let i = 0; i < data.length; i++) {
						if (data[i] > peak) {
							peak = data[i];
							peak_idx = i;
						}
					}
					let f = (n: number) => (n * 22050) / (data.length - 1);
					console.log('peak', data.length, peak_idx, f(peak_idx), f(peak_idx - 1), f(peak_idx + 1));
				}}
			/>
			<Waveform data={fft_peaks} limit={10000} scale={6} cursor={offset / 128} />
			<Waveform data={crossing_pitches} limit={10000} scale={6} cursor={offset / 256} />
			<Spectrogram data={fft_spectrogram} />
		{/if}
	</div>
	<div>
		<input
			type="file"
			onchange={(e) => {
				if (!e.target) {
					return;
				}
				let files = (e.target as HTMLInputElement).files;
				if (!files?.length) {
					throw new Error('No files');
				}
				let file = files[0];

				let reader = new FileReader();
				reader.onload = async (e) => {
					if (!e.target) {
						return;
					}
					const content = e.target.result;
					let audio_context = new AudioContext();
					audio_data = await audio_context.decodeAudioData(content as ArrayBuffer);
				};

				reader.readAsArrayBuffer(file);
			}}
		/>
		<button class="gray" onclick={load_sin}>Sin</button>
		<button class="gray" onclick={play}>Play</button>
		<button onclick={record} disabled={state_old.recording}><Circle /></button>
		<button onclick={pause} disabled={!state_old.recording}><PauseCircle /></button>
		<button onclick={stop} disabled={!state_old.recording}><StopCircle /></button>
		<input type="checkbox" bind:checked={hann} />
		<input type="range" min="0" max="1" step="0.01" bind:value={range_value} />
		<input type="range" min="0" max="1" step="0.01" bind:value={range_value2} />
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	#rootdiv {
		position: relative;
		margin: 20px;
	}

	button {
		background-color: white;
		border: 0px;
	}

	.gray {
		background-color: gray;
	}
</style>
