<script lang="ts">
	import {
		DEFAULT_AUDIO_SAMPLERATE,
		SampleSlice,
		type Sample,
		type SampleData
	} from '$lib/audio/sample';
	import { remapNumber, remapPoint, span2d, type Point, type Span2D } from '$lib/geometry/geometry';
	import { mouse, type MouseState, type MouseStateHandler } from '$lib/input/mouse';
	import { onMount } from 'svelte';

	let {
		data,
		span = span2d(0, 1, -1, 1),
		width = 400,
		height = 200,
		cursor = 0,
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
		onWheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
		onMouse?: MouseStateHandler;
	} = $props();

	let canvas: HTMLCanvasElement;

	const draw = (context: CanvasRenderingContext2D, sample: Sample) => {
		context.fillStyle = 'rgb(200 200 200)';
		context.fillRect(0, 0, width, height);
		context.beginPath();
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.fillStyle = 'black';
		context.lineJoin = 'round';

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

				const mappedMin = remapNumber(min, span.y, screenSpan.y);
				const mappedMax = remapNumber(max, span.y, screenSpan.y);
				const rectY = height - mappedMax;
				const rectH = Math.max(mappedMax - mappedMin, 1);
				context.fillRect(chunk, rectY, 1, rectH);
			}
		} else {
			for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
				const x = (index - sampleStart) / sampleSpan;
				const y = remapNumber(sample.get(index), span.y, screenSpan.y);
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
