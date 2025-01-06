<script lang="ts">
	import { draw_waveform } from '$lib/audio/draw';
	import { context } from '$lib/dsp/dsp';
	import { onMount } from 'svelte';

	let {
		data,
		size = 1024,
		offset = 0,
		base = 0,
		span = 256,
		width = 400,
		height = 200,
		scale,
		onwheel = () => {}
	}: {
		data: Float32Array;
		size?: number;
		offset?: number;
		base?: number;
		span?: number;
		width?: number;
		height?: number;
		scale?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();

	let fft_context = context();
	let canvas: HTMLCanvasElement;

	onMount(() => {
		let draw = () => {
			const context = canvas.getContext('2d');
			if (context) {
				let result = fft_context.fft_real(data.slice(offset, offset + size));
				context.fillStyle = 'rgb(200 200 200)';
				context.fillRect(0, 0, width, height);
				context.strokeStyle = 'black';
				context.fillStyle = 'black';
				draw_waveform(context, result, { offset: base, limit: span, scale, y: 0 });
			}
			requestAnimationFrame(draw);
		};
		draw();
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	onwheel={(e) => onwheel({ x: e.deltaX, y: e.deltaY }, e)}
></canvas>
