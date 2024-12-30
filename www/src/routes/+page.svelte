<script lang="ts">
	import { processor } from '$lib/audio/processor';
	import Circle from '$lib/icons/Circle.svelte';
	import PauseCircle from '$lib/icons/PauseCircle.svelte';
	import StopCircle from '$lib/icons/StopCircle.svelte';
	import { onMount } from 'svelte';
	import { context, dsp_greet } from '$lib/dsp/dsp';
	import { combine, draw_waveform } from '$lib/audio/draw';
	import { scale } from 'svelte/transition';

	let width = 400;
	let height = 200;

	let audio_canvas: HTMLCanvasElement;
	let spectrum_canvas: HTMLCanvasElement;
	let audio_chunks: Float32Array[] = [];
	let state: {
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
	let fft_context = context();
	let fft_window = new Float32Array(1024 * 4);
	// size of an audio chunk (not configurable)
	const CHUNK_SIZE = 128;

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
		let result = fft_context.fft_real(fft_window);

		spectrum_context.fillStyle = 'rgb(200 200 200)';
		spectrum_context.fillRect(0, 0, width, height);

		draw_waveform(spectrum_context, result.slice(0, 256), { scale: -1 });
	};

	let record = async () => {
		if (state.recording) {
			return;
		}
		state.recording = true;

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

		let node = new AudioWorkletNode(audio_context, processor.name, {});
		source.connect(node);
		node.connect(gain);
		gain.connect(audio_context.destination);
		state.stream = stream;
		state.context = audio_context;
		state.node = node;
		state.gain = gain;

		node.port.onmessage = (e) => {
			if (state.recording && !state.paused) {
				audio_chunks.push(e.data[0]);
			}
		};
		gain.gain.linearRampToValueAtTime(0.9, audio_context.currentTime + 0.5);
	};

	let pause = async () => {
		if (!state.recording || !state.context) {
			return;
		}
		state.paused = !state.paused;
		let gain = state.paused ? 0.0 : 0.9;
		console.log(gain);
		state.gain?.gain.linearRampToValueAtTime(gain, state.context.currentTime + 0.1);
	};

	let stop = async () => {
		state.stream?.getAudioTracks().forEach((track) => {
			track.enabled = false;
		});
		state.recording = false;
		state.paused = false;
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

	onMount(() => {
		let draw_loop = () => {
			draw_latest(audio_chunks);
			requestAnimationFrame(draw_loop);
		};
		draw_loop();
	});

	console.log('greeting', dsp_greet(), fft_context);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<div>
	<div
		onwheel={(e) => {
			state.scrollX += e.deltaX;
			state.scrollY += e.deltaY;
		}}
	>
		<canvas bind:this={audio_canvas} {width} {height}></canvas>
		<canvas bind:this={spectrum_canvas} {width} {height}></canvas>
	</div>
	<div>
		<button onclick={record} disabled={state.recording}><Circle /></button>
		<button onclick={pause} disabled={!state.recording}><PauseCircle /></button>
		<button onclick={stop} disabled={!state.recording}><StopCircle /></button>
	</div>
</div>

<style>
	button {
		background-color: white;
		border: 0px;
	}
</style>
