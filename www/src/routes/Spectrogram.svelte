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

		let overall_peak = 1e-6;
		for (let i = 0; i < Math.min(data.length, width); i++) {
			for (let j = 0; j < data[i].length; j++) {
				overall_peak = Math.max(overall_peak, data[i][j]);
			}
		}

		let image = context.createImageData(width, height);
		let step = 1;
		for (let x = 0; x < width; x++) {
			let peak = 1e-6;
			for (let j = 0; j < data[x].length; j++) {
				peak = Math.max(peak, data[x][j]);
			}
			for (let y = 0; y < height; y++) {
				let idx = ((height - y - 1) * width + x / step) * 4;
				let value = data[x]?.[y];
				if (value > peak * 0.95) {
					image.data[idx] = 255;
					image.data[idx + 1] = 0;
					image.data[idx + 2] = 255;
				} else {
					let mapped = Math.floor((value / overall_peak) * 256);
					image.data[idx] = mapped;
					image.data[idx + 1] = mapped;
					image.data[idx + 2] = mapped;
				}
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
