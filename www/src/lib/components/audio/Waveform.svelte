<script lang="ts">
	import {
		DEFAULT_AUDIO_SAMPLERATE,
		SampleSlice,
		type Sample,
		type SampleData
	} from '$lib/audio/sample';
	import { span1d, span2d, type Point, type Span2D } from '$lib/math/geometry';
	import { mouse, type MouseState, type MouseStateHandler } from '$lib/input/mouse';
	import { onMount } from 'svelte';
	import { axisLines, axisLines2, axisLines3, axisLinesLog, AxisScale } from '$lib/audio/draw';

	let {
		data,
		span = span2d(0, 1, -1, 1),
		width = 400,
		height = 200,
		cursor = 0,
		strokeWidth = 1,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		scale = AxisScale.Linear,
		stairstep = false,
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
		scale?: AxisScale;
		stairstep?: boolean;
		onWheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
		onMouse?: MouseStateHandler;
	} = $props();

	let canvas: HTMLCanvasElement;

	const logScale = $derived(scale === AxisScale.Log && span.y.min > 0);
	const screenSpan = $derived(span2d(0, width, 0, height));
	const screenMapX = $derived((value: number) => span.x.remap(value, screenSpan.x));
	const screenMapY = $derived(
		logScale
			? (value: number) =>
					height -
					span1d(Math.log(span.y.min), Math.log(span.y.max)).remap(Math.log(value), screenSpan.y)
			: (value: number) => height - span.y.remap(value, screenSpan.y)
	);

	const draw = (context: CanvasRenderingContext2D, sample: Sample) => {
		context.fillStyle = 'rgb(255 255 255)';
		context.fillRect(0, 0, width, height);

		context.lineWidth = 1;
		const horizontalAxis = axisLines3(span.x, 1.2);
		for (const layer of horizontalAxis) {
			context.beginPath();
			context.strokeStyle = `rgba(0, 0, 0, ${layer.weight * 0.5})`;
			for (const tick of layer.values) {
				const pos = screenMapX(tick);
				context.moveTo(pos, 0);
				context.lineTo(pos, height);
			}
			context.stroke();
		}

		const verticalAxis = logScale ? axisLinesLog(span.y, 1.2) : axisLines3(span.y, 1.2);
		for (const layer of verticalAxis) {
			context.beginPath();
			context.strokeStyle = `rgba(0, 0, 0, ${layer.weight * 0.5})`;
			for (const tick of layer.values) {
				const pos = Math.floor(screenMapY(tick)) - 0.5;
				context.moveTo(0, pos);
				context.lineTo(width, pos);
			}
			context.stroke();
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

		let sampleStartIndex = Math.max(Math.floor(sampleStart), 0);
		const sampleEndIndex = Math.min(Math.ceil(sampleEnd), sample.length);
		// const 
		// const sampleEndIndex = sample.length;

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

				const mappedMin = screenMapY(min);
				const mappedMax = screenMapY(max);
				// mappedMax is the top of the rect
				const rectY = mappedMax - stroke;
				const rectH = mappedMin - mappedMax + stroke;
				context.fillRect(chunk, rectY, 1, rectH);
			}
		} else {
			if (stairstep) {
				let lastValue = sample.get(sampleStartIndex);
				for (let index = 0; index < width; index++) {
					const x = (index / width) * sampleSpan + sampleStart;
					const x1 = Math.floor(x);
					const x2 = Math.ceil(x);
					const weight = x - x1;
					const v1 = sample.get(x1);
					const v2 = sample.get(x2);
					const value = v1 + weight * (v2 - v1);
					const y1 = Math.floor(screenMapY(lastValue)) + 0.5;
					const y2 = Math.floor(screenMapY(value)) + 0.5;
					const minY = Math.min(y1, y2);
					const maxY = Math.max(y1, y2);
					context.fillRect(index, minY, 1, Math.max(1, maxY - minY));
					lastValue = value;
				}
			} else {
				for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
					const x = (index - sampleStart) / sampleSpan;
					const y = screenMapY(sample.get(index));
					context.lineTo(x * width, y);
				}
				context.stroke();
			}
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
