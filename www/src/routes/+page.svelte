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
	let fft_context = context();
	let fft_window = new Float32Array(1024 * 4);
	// size of an audio chunk (not configurable)
	const CHUNK_SIZE = 128;
	let scale_lin = $state({ x: 4.5, y: 0 });
	let offset = $state(0);

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

		let node = new AudioWorkletNode(audio_context, processor.name, {});
		source.connect(node);
		node.connect(gain);
		gain.connect(audio_context.destination);
		state_old.stream = stream;
		state_old.context = audio_context;
		state_old.node = node;
		state_old.gain = gain;

		node.port.onmessage = (e) => {
			if (state_old.recording && !state_old.paused) {
				audio_chunks.push(e.data[0]);
			}
		};
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
	};

	let pause = async () => {
		if (!state_old.recording || !state_old.context) {
			return;
		}
		state_old.paused = !state_old.paused;
		let gain = state_old.paused ? 0.0 : 0.9;
		console.log(gain);
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

	onMount(() => {
		let draw_loop = () => {
			draw_latest(audio_chunks);
			requestAnimationFrame(draw_loop);
		};
		draw_loop();
	});

	console.log('greeting', dsp_greet(), fft_context);

	let audio_raw = $derived.by(() => {
		// console.log(audio_data?.getChannelData(0)[0]);
		return audio_data?.getChannelData(0);
	});

	// $effect(() => console.log({ audio_raw }));
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<div>
	<div
		onwheel={(e) => {
			state_old.scrollX += e.deltaX;
			state_old.scrollY += e.deltaY;
		}}
	>
		<canvas bind:this={audio_canvas} {width} {height}></canvas>
		<canvas bind:this={spectrum_canvas} {width} {height}></canvas>
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
					offset = Math.max(0, offset + x * 100);
				}}
			/>
			<Spectrum data={audio_raw} {offset} size={1024} span={256} scale={height / 4} />
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
				console.log(file);

				let reader = new FileReader();
				reader.onload = async (e) => {
					if (!e.target) {
						return;
					}
					const content = e.target.result;
					let audio_context = new AudioContext();
					audio_data = await audio_context.decodeAudioData(content as ArrayBuffer);
					console.log(audio_data);
				};

				reader.readAsArrayBuffer(file);
			}}
		/>
		<button onclick={play}>Play</button>
		<button onclick={record} disabled={state_old.recording}><Circle /></button>
		<button onclick={pause} disabled={!state_old.recording}><PauseCircle /></button>
		<button onclick={stop} disabled={!state_old.recording}><StopCircle /></button>
	</div>
</div>

<style>
	button {
		background-color: white;
		border: 0px;
	}
</style>
