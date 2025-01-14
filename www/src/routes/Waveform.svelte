<script lang="ts">
	import { draw_waveform } from '$lib/audio/draw';
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
		data: Float32Array | number[];
		offset?: number;
		limit?: number;
		width?: number;
		height?: number;
		scale?: number;
		cursor?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();

	let canvas: HTMLCanvasElement;

	onMount(() => {
		let draw = () => {
			const context = canvas.getContext('2d');
			if (context) {
				context.fillStyle = 'rgb(200 200 200)';
				context.fillRect(0, 0, width, height);
				context.strokeStyle = 'black';
				context.fillStyle = 'black';
				if (cursor) {
					let cursor_x = (cursor * width) / Math.min(limit, data.length);
					context.moveTo(cursor_x, 0);
					context.lineTo(cursor_x, height);
					context.stroke();
				}
				draw_waveform(context, data, { offset, limit, scale: (scale * height) / 2 });
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
