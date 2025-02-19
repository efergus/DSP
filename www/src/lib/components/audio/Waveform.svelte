<script lang="ts">
	import { draw_waveform } from '$lib/audio/draw';
	import { DEFAULT_AUDIO_SAMPLERATE, type AudioSample } from '$lib/audio/sample';
	import { span2d, type Point, type Span2D } from '$lib/geometry/geometry';
	import { onMount } from 'svelte';

	let {
		data,
		span = span2d(0, 1, -1, 1),
		width = 400,
		height = 200,
		cursor = 0,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		onwheel = () => {}
	}: {
		data: AudioSample;
		span?: Span2D;
		samplerate?: number;
		width?: number;
		height?: number;
		cursor?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let path = $derived.by(() => {
		const sampleStart = span.x.min * samplerate;
		const sampleEnd = span.x.max * samplerate;
		const sampleSpan = sampleEnd - sampleStart;
		const verticalSpan = span.y.max - span.y.min;

		const sampleStartIndex = Math.max(Math.floor(sampleStart), 0);
		const sampleEndIndex = Math.min(Math.ceil(sampleEnd), data.length);

		const points: Point[] = [];
		for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
			points.push({
				x: (index - sampleStart) / sampleSpan,
				y: data.getFrame(index) / verticalSpan
			});
		}

		return points;
	});

	const pathData = $derived.by(() => {
		const res = [];
		let command = 'M';
		for (const point of path) {
			res.push(`${command} ${point.x * width} ${(-point.y * height) / 2 + height / 2}`);
			command = 'L';
		}
		return res.join(' ');
	});

	// $inspect({ path });
	// $inspect({ span, duration: data.duration() * DEFAULT_AUDIO_SAMPLERATE, length: data.length });

	// const draw = (context: CanvasRenderingContext2D, sample: AudioSample) => {
	// 	context.fillStyle = 'rgb(200 200 200)';
	// 	context.fillRect(0, 0, width, height);
	// 	context.beginPath();
	// 	context.strokeStyle = 'black';
	// 	context.lineWidth = 2;
	// 	context.fillStyle = 'black';
	// 	context.lineJoin = 'round';

	// 	const sampleStart = span.x.min * samplerate;
	// 	const sampleEnd = span.x.max * samplerate;
	// 	const sampleSpan = sampleEnd - sampleStart;
	// 	const verticalSpan = span.y.max - span.y.min;

	// 	const sampleStartIndex = Math.max(Math.floor(sampleStart), 0);
	// 	const sampleEndIndex = Math.min(Math.ceil(sampleEnd), sample.length);
	// 	for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
	// 		const x = (index - sampleStart) / sampleSpan;
	// 		const y = sample.getFrame(index) / verticalSpan;
	// 		context.lineTo(x * width, (-y * height) / 2 + height / 2);
	// 	}
	// 	context.stroke();
	// };

	// $effect(() => {
	// 	const context = canvas?.getContext('2d');
	// 	if (!context) {
	// 		return;
	// 	}
	// 	draw(context, data);
	// });

	// onMount(() => {
	// 	let draw = () => {
	// 		const context = canvas.getContext('2d');
	// 		if (context) {
	// 			context.fillStyle = 'rgb(200 200 200)';
	// 			context.fillRect(0, 0, width, height);
	// 			context.strokeStyle = 'black';
	// 			context.fillStyle = 'black';
	// 			context.lineJoin = 'round';
	// 			// if (cursor) {
	// 			// 	let cursor_x = (cursor * width) / Math.min(limit, data.length);
	// 			// 	context.moveTo(cursor_x, 0);
	// 			// 	context.lineTo(cursor_x, height);
	// 			// 	context.stroke();
	// 			// }
	// 			// draw_waveform(context, data, { offset, limit, scale: (scale * height) / 2 });
	// 		}
	// 		requestAnimationFrame(draw);
	// 	};
	// 	draw();
	// });
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	onwheel={(e) => onwheel({ x: e.deltaX, y: e.deltaY }, e)}
></canvas>
<svg
	{width}
	{height}
	viewBox={`0 0 ${width} ${height}`}
	stroke="black"
	fill="none"
	stroke-width="2"
>
	<path d={pathData} />
</svg>
