<script lang="ts">
	import { draw_waveform } from '$lib/audio/draw';
	import { hann_index } from '$lib/audio/window';
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
		scale = 1,
		hann = false,
		pad,
		onwheel = () => {},
		onfft = () => {}
	}: {
		data: Float32Array;
		size?: number;
		offset?: number;
		base?: number;
		span?: number;
		width?: number;
		height?: number;
		scale?: number;
		hann?: boolean;
		pad?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
		onfft?: (data: Float32Array) => void;
	} = $props();

	let fft_context = context();
	let canvas: HTMLCanvasElement;

	let fft_data = $derived.by(() => {
		let slice = new Float32Array(Math.max(size, pad ?? 0));
		slice.set(data.slice(offset, offset + size));
		if (hann) {
			for (let i = 0; i < size; i++) {
				slice[i] *= hann_index(i, size);
			}
		}
		// return fft_context.fft_norm(slice).map((val) => Math.log10(val) / 10);
		return fft_context.fft_norm(slice);
	});
	$effect(() => onfft(fft_data));

	onMount(() => {
		let draw = () => {
			const context = canvas.getContext('2d');
			if (context) {
				context.fillStyle = 'rgb(200 200 200)';
				context.fillRect(0, 0, width, height);
				context.strokeStyle = 'black';
				context.fillStyle = 'black';
				draw_waveform(context, fft_data, {
					offset: base,
					limit: span,
					scale: scale * height
					// y: 0
				});
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
