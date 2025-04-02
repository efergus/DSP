<script lang="ts">
	import {
		DEFAULT_AUDIO_SAMPLERATE,
		SampleSlice,
		type Sample,
		type SampleData
	} from '$lib/audio/sample';
	import { Span1D, span1d, span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import { mouse, type MouseState, type MouseStateHandler } from '$lib/input/mouse';
	import { onMount } from 'svelte';
	import { axisLines, axisLinesLog, AxisScale } from '$lib/audio/axes';
	import { point, type Point } from '$lib/math/point';
	import { drawAxes } from '$lib/graphics/axes';

	let {
		data,
		filteredData,
		span = $bindable(span2d(0, 1, -1, 1)),
		width = 500,
		height = 200,
		cursor = 0,
		strokeWidth = 1,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		scale = AxisScale.Linear,
		axisSizeX = 36,
		axisSizeY = 48,
		stairstep = false,
		onZoom,
		onMove
	}: {
		data: Sample;
		filteredData?: Sample;
		span?: Span2D;
		samplerate?: number;
		width?: number;
		height?: number;
		cursor?: number;
		strokeWidth?: number;
		// size of the x axis (takes up vertical space)
		axisSizeX?: number;
		// size of the y axis (takes up horizontal space)
		axisSizeY?: number;
		scale?: AxisScale;
		stairstep?: boolean;
		onZoom?: (delta: { x: number; y: number }, pos: Point) => void;
		onMove?: (delta: { x: number; y: number }, pos: Point) => void;
	} = $props();

	let canvas: HTMLCanvasElement;

	let styleSize = $state(point(width, height));
	let localMousePos = $state(point());
	let mappedMousePos = $state(point());
	let padding = $state(point());
	const logScale = $derived(scale === AxisScale.Log && span.y.start > 0);
	const screenSpan = $derived(span2d(axisSizeY, width, height - axisSizeX, 0));
	const screenMapX = $derived((value: number) => span.x.remap(value, screenSpan.x));
	const screenMapY = $derived(
		logScale
			? (value: number) =>
					span1d(Math.log(span.y.start), Math.log(span.y.end)).remap(Math.log(value), screenSpan.y)
			: (value: number) => span.y.remap(value, screenSpan.y)
	);

	const isInVerticalAxis = $derived(
		(pos: Point) => pos.x <= axisSizeY && pos.y < height - axisSizeX
	);
	const isInHorizontalAxis = $derived(
		(pos: Point) => pos.x > axisSizeY && pos.y >= height - axisSizeX
	);
	const isInBody = $derived((pos: Point) => pos.x > axisSizeY && pos.y < height - axisSizeX);

	type WaveformOptions = {
		color?: string;
		weight?: number;
	};

	const drawWaveform = (
		context: CanvasRenderingContext2D,
		sample: Sample,
		options: WaveformOptions = {}
	) => {
		const { color = 'black', weight = 1 } = options;
		context.save();
		context.beginPath();
		context.rect(axisSizeY, 0, width - axisSizeY, height - axisSizeX);
		context.clip();

		context.beginPath();
		context.strokeStyle = color;
		context.lineWidth = strokeWidth * weight;
		context.fillStyle = color;
		context.lineJoin = 'round';

		const stroke = (strokeWidth * weight) / 2;

		const sampleStart = span.x.start * samplerate;
		const sampleEnd = span.x.end * samplerate;
		const sampleSpan = sampleEnd - sampleStart;

		let startIndex = Math.max(0, Math.floor(sampleStart));
		const endIndex = Math.min(sample.length, Math.ceil(sampleEnd) + 1);

		if (sampleSpan > width * 2) {
			context.lineWidth = 1;

			const chunkStride = sampleSpan / width;
			for (let chunk = 0; chunk < width; chunk++) {
				const base = Math.floor(screenSpan.x.remap(chunk, span.x) * samplerate);
				if (base < 0 || base >= sample.length) {
					continue;
				}
				const val = sample.get(base);
				let min = val;
				let max = val;
				for (let index = 0; index < chunkStride && base + index < endIndex; index++) {
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
				let lastValue = sample.get(startIndex);
				for (let index = screenSpan.x.start; index < screenSpan.x.end; index++) {
					const x = screenSpan.x.remap(index, span.x) * samplerate;
					if (x < 0 || x >= sample.length) {
						continue;
					}
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
				for (let index = startIndex; index < endIndex; index++) {
					const x = span.x.remap(index / samplerate, screenSpan.x);
					const y = screenMapY(sample.get(index));
					context.lineTo(x, y);
				}
				context.stroke();
			}
		}
		context.restore();
	};

	const draw = (context: CanvasRenderingContext2D, sample: Sample, filtered?: Sample) => {
		const rect = canvas.getBoundingClientRect();
		padding = point(Math.floor(rect.x) - rect.x, Math.floor(rect.y) - rect.y);
		// console.log(rect);

		context.fillStyle = 'rgb(255 255 255)';
		context.fillRect(0, 0, width, height);

		// drawAxis(context, span.x, false);
		// drawAxis(context, span.y, true);
		drawAxes(context, { span, sizeX: axisSizeX, sizeY: axisSizeY });

		drawWaveform(context, sample);
		if (filtered) {
			drawWaveform(context, filtered, { color: 'red', weight: 2 });
		}
	};

	onMount(() => {
		const pixelRatio = window.devicePixelRatio;
		styleSize = point(width * pixelRatio, height * pixelRatio);

		const context = canvas.getContext('2d');
		if (!context) {
			console.warn('No context!');
			return;
		}
		const drawData = () => {
			draw(context, data, filteredData);
			requestAnimationFrame(drawData);
		};
		requestAnimationFrame(drawData);
	});
</script>

<canvas
	bind:this={canvas}
	style:width={`${styleSize.x}px`}
	style:height={`${styleSize.y}px`}
	{width}
	{height}
	onwheel={(e) => {
		e.preventDefault();
		const shiftKey = e.shiftKey;
		const ctrlKey = e.ctrlKey;
		const mode = e.deltaMode; // 0: pixels, 1: lines, 2: pages
		const modeScale = [1, 10, 100];
		const deltaY = (-e.deltaY / 100) * modeScale[mode];
		if (isInHorizontalAxis(localMousePos) && shiftKey) {
			// shift & horizontal => scroll
			const distance = (deltaY * span.x.size()) / 2;
			if (onMove) {
				onMove(point(distance, 0), mappedMousePos);
			} else {
				span = span2dFromSpans(span.x.move(distance), span.y);
			}
		} else if (isInVerticalAxis(localMousePos) && shiftKey) {
			// shift & vertical => scroll
			const distance = (deltaY * span.y.size()) / 2;
			if (onMove) {
				onMove(point(0, distance), mappedMousePos);
			} else {
				span = span2dFromSpans(span.x, span.y.move(distance));
			}
		} else if ((isInBody(localMousePos) && shiftKey) || isInVerticalAxis(localMousePos)) {
			const yPos = mappedMousePos.y;
			const scaleY = Math.exp(deltaY);
			if (onZoom) {
				onZoom({ x: 1, y: deltaY }, mappedMousePos);
			} else {
				span = span2dFromSpans(span.x, span.y.scale(scaleY, yPos));
			}
		} else {
			const xPos = mappedMousePos.x;
			const scaleX = Math.exp(deltaY);
			if (onZoom) {
				onZoom({ x: deltaY, y: 1 }, mappedMousePos);
			} else {
				span = span2dFromSpans(span.x.scale(scaleX, xPos), span.y);
			}
		}
	}}
	{...mouse(({ pos, delta, down }) => {
		localMousePos = pos;
		mappedMousePos = screenSpan.remap(pos, span);
		if (down) {
			const mappedDelta = screenSpan.remapSize(delta, span);
			if (isInHorizontalAxis(localMousePos)) {
				mappedDelta.y = 0;
			}
			if (isInVerticalAxis(localMousePos)) {
				mappedDelta.x = 0;
			}
			if (onMove) {
				onMove(mappedDelta, mappedMousePos);
			} else {
				span = span.move(-mappedDelta.x, mappedDelta.y);
			}
		}
	})}
></canvas>

<style></style>
