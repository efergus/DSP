<script lang="ts">
	import {
		DEFAULT_AUDIO_SAMPLERATE,
		SampleSlice,
		type Sample,
		type SampleData
	} from '$lib/audio/sample';
	import { span2d, type Point, type Span2D } from '$lib/math/geometry';
	import { mouse, type MouseState, type MouseStateHandler } from '$lib/input/mouse';
	import { onMount } from 'svelte';
	import { axisLines, axisLines2 } from '$lib/audio/draw';

	let {
		data,
		span = span2d(0, 1, -1, 1),
		width = 400,
		height = 200,
		cursor = 0,
		strokeWidth = 2,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		onWheel = () => {},
		onMouse = () => {}
	}: {
		data: Sample;
		span?: Span2D;
		samplerate?: number;
		width?: number;
		height?: number;
		cursor?: number;
		strokeWidth?: number;
		onWheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
		onMouse?: MouseStateHandler;
	} = $props();

	let canvas: HTMLCanvasElement;

	const horizontalAxis = $derived(Array.from(axisLines2(span.x, 1.4)));
	const verticalAxis = $derived(Array.from(axisLines2(span.y, 1.4)));
	$inspect({ horizontalAxis });

	const draw = (context: CanvasRenderingContext2D, sample: Sample) => {
		context.fillStyle = 'rgb(200 200 200)';
		context.fillRect(0, 0, width, height);

		context.beginPath();
		context.lineWidth = 1;
		context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		for (const line of horizontalAxis) {
			context.moveTo(line.pos * width, 0);
			context.lineTo(line.pos * width, height);
		}
		for (const line of verticalAxis) {
			context.moveTo(0, height - line.pos * height);
			context.lineTo(width, height - line.pos * height);
		}
		context.stroke();

		context.beginPath();
		context.strokeStyle = 'black';
		context.lineWidth = strokeWidth;
		context.fillStyle = 'black';
		context.lineJoin = 'round';

		const stroke = strokeWidth / 2;

		const sampleStart = span.x.min * samplerate;
		const sampleEnd = span.x.max * samplerate;
		const sampleSpan = sampleEnd - sampleStart;
		const screenSpan = span2d(0, width, 0, height);

		let sampleStartIndex = Math.max(Math.floor(sampleStart), 0);
		// const sampleEndIndex = Math.min(Math.ceil(sampleEnd), sample.length);
		const sampleEndIndex = sample.length;

		const h2 = Math.ceil(height / 2);

		if (sampleSpan > width * 2) {
			context.lineWidth = 1;

			const chunkStride = sampleSpan / width;
			sampleStartIndex = sampleStartIndex - (sampleStartIndex % Math.floor(chunkStride));
			for (let chunk = 0; chunk < width; chunk++) {
				const base = sampleStartIndex + Math.floor(chunk * chunkStride);
				if (base >= sample.length) {
					break;
				}
				const val = sample.get(base);
				let min = val;
				let max = val;
				for (let index = 0; index < chunkStride && base + index < sampleEndIndex; index++) {
					const val = sample.get(base + index);
					min = Math.min(min, val);
					max = Math.max(max, val);
				}

				const mappedMin = span.y.remap(min, screenSpan.y);
				const mappedMax = span.y.remap(max, screenSpan.y);
				const rectY = height - mappedMax - stroke;
				const rectH = mappedMax - mappedMin + stroke;
				context.fillRect(chunk, rectY, 1, rectH);
			}
		} else {
			for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
				const x = (index - sampleStart) / sampleSpan;
				const y = span.y.remap(sample.get(index), screenSpan.y);
				context.lineTo(x * width, height - y);
			}
			context.stroke();
		}
	};

	onMount(() => {
		const context = canvas.getContext('2d');
		if (!context) {
			console.warn('No context!');
			return;
		}
		const drawData = () => {
			draw(context, data);
			requestAnimationFrame(drawData);
		};
		requestAnimationFrame(drawData);
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	style={`width: ${width}px; height: ${height}px`}
	onwheel={(e) => onWheel({ x: e.deltaX, y: e.deltaY }, e)}
	{...mouse(onMouse, {
		remap: span
	})}
></canvas>
