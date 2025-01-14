<script lang="ts">
	import { draw_waveform } from '$lib/audio/draw';
	import { context } from '$lib/dsp/dsp';
	import { onMount } from 'svelte';

	let {
		data,
		offset = 0,
		limit = 44100,
		width = 400,
		height = 200,
		scale = 1,
		cursor = 0,
		onwheel = () => {}
	}: {
		data: Float32Array[];
		offset?: number;
		limit?: number;
		width?: number;
		height?: number;
		scale?: number;
		cursor?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();
	let canvas: HTMLCanvasElement;
	// let fft_context = context();

	$effect(() => {
		let context = canvas.getContext('2d');
		if (!context) {
			return;
		}

		let image = context.createImageData(width, height);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let idx = ((height - y - 1) * width + x) * 4;
				let value = data[x]?.[y];
				let mapped = Math.floor(value * 200);
				image.data[idx] = mapped;
				image.data[idx + 1] = mapped;
				image.data[idx + 2] = mapped;
				image.data[idx + 3] = 255;
			}
		}

		context.putImageData(image, 0, 0);
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	onwheel={(e) => onwheel({ x: e.deltaX, y: e.deltaY }, e)}
></canvas>
