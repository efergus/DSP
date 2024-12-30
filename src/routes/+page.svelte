<script lang="ts">
	import { processor } from '$lib/audio/processor';
	import Circle from '$lib/icons/Circle.svelte';
	import PauseCircle from '$lib/icons/PauseCircle.svelte';
	import StopCircle from '$lib/icons/StopCircle.svelte';
	import { onMount } from 'svelte';

	let width = 400;
	let height = 200;

	let audio_canvas: HTMLCanvasElement;
	let audio_chunks: Float32Array[] = [];
	let state: {
		recording: boolean;
		paused: boolean;
		scrollX: number;
		scrollY: number;
		context: AudioContext | null;
		node: AudioWorkletNode | null;
		gain: GainNode | null;
	} = {
		recording: false,
		paused: false,
		scrollX: 0,
		scrollY: 0,
		context: null,
		node: null,
		gain: null
	};

	let draw_latest = (audio_chunks: Float32Array[]) => {
		const context = audio_canvas.getContext('2d');
		if (!context) {
			throw new Error('No context!');
		}

		context.fillStyle = 'rgb(200 200 200)';
		context.fillRect(0, 0, width, height);

		context.lineWidth = 2;
		context.strokeStyle = 'rgb(0 0 0)';

		const sample_width = Math.floor(44100 * Math.exp(state.scrollY / 1000));
		const dx = width / sample_width;
		let x = width + (state.scrollX * sample_width) / 1000000;
		let y = height / 2;

		context.beginPath();
		context.moveTo(x, y);
		for (let chunk = audio_chunks.length - 1; chunk >= 0; chunk--) {
			let data = audio_chunks[chunk];
			for (let i = data.length - 1; i >= 0; i--) {
				let dy = -(data[i] * height) / 2;
				context.lineTo(x, y + dy);
				x -= dx;
			}
			if (x <= 0) {
				break;
			}
		}
		context.stroke();
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
		state.context = audio_context;
		state.node = node;
		state.gain = gain;

		node.port.onmessage = (e) => {
			if (!state.paused) {
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

	let stop = async () => {};

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
	</div>
	<div>
		<button onclick={record} disabled={state.recording}><Circle /></button>
		<button onclick={pause} disabled={!state.recording}><PauseCircle /></button>
	</div>
</div>

<style>
	button {
		background-color: white;
		border: 0px;
	}
</style>
