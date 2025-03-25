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

	let {
		data,
		span = $bindable(span2d(0, 1, -1, 1)),
		width = 500,
		height = 300,
		cursor = 0,
		strokeWidth = 1,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		scale = AxisScale.Linear,
		axisSize = 24,
		stairstep = false,
		onZoom,
		onMove
	}: {
		data: Sample;
		span?: Span2D;
		samplerate?: number;
		width?: number;
		height?: number;
		cursor?: number;
		strokeWidth?: number;
		axisSize?: number;
		scale?: AxisScale;
		stairstep?: boolean;
		onZoom?: (delta: { x: number; y: number }, pos: Point) => void;
		onMove?: (delta: { x: number; y: number }, pos: Point) => void;
	} = $props();

	let canvas: HTMLCanvasElement;

	let localMousePos = $state(point());
	let mappedMousePos = $state(point());
	const logScale = $derived(scale === AxisScale.Log && span.y.start > 0);
	const screenSpan = $derived(span2d(axisSize, width, height - axisSize, 0));
	const screenMapX = $derived((value: number) => span.x.remap(value, screenSpan.x));
	const screenMapY = $derived(
		logScale
			? (value: number) =>
					span1d(Math.log(span.y.start), Math.log(span.y.end)).remap(Math.log(value), screenSpan.y)
			: (value: number) => span.y.remap(value, screenSpan.y)
	);

	const isInVerticalAxis = $derived((pos: Point) => pos.x <= axisSize && pos.y < height - axisSize);
	const isInHorizontalAxis = $derived(
		(pos: Point) => pos.x > axisSize && pos.y >= height - axisSize
	);
	const isInBody = $derived((pos: Point) => pos.x > axisSize && pos.y < height - axisSize);

	const drawAxis = (context: CanvasRenderingContext2D, span: Span1D, vertical: boolean) => {
		context.save();
		// clip rectangle
		context.beginPath();
		if (vertical) {
			context.rect(0, 0, width, height - axisSize);
			context.textBaseline = 'top';
		} else {
			context.rect(axisSize, 0, width - axisSize, height);
			context.textBaseline = 'bottom';
		}
		context.clip();

		const maxDepth = 2.2;
		const axis = axisLines(span, maxDepth);
		context.lineWidth = 1;
		const layers = Array.from(axis);
		for (let index = layers.length - 1; index >= 0; index--) {
			const layer = layers[index];
			context.beginPath();
			const textOffset = 4;
			const textSize = Math.floor(5 * (1 + layer.weight));
			const level = 255 - layer.weight * 128;
			const color = `rgb(${level}, ${level}, ${level})`;
			context.strokeStyle = color;
			const textLevel = 255 - Math.max(0, 1 - layer.depth ** 2) * 255;
			const textColor = `rgb(${textLevel}, ${textLevel}, ${textLevel})`;
			context.fillStyle = textColor;
			context.font = `${textSize}px sans-serif`;
			if (vertical) {
				const extent = layer.depth < 1.2 ? width : axisSize;
				for (const tick of layer.values) {
					const pos = Math.floor(screenMapY(tick)) + 0.5;
					context.moveTo((1 - layer.weight) * axisSize, pos);
					context.lineTo(extent, pos);
					if (layer.depth <= 1) {
						context.fillText(layer.format(tick), 0, pos + textOffset);
					}
				}
			} else {
				const start = layer.depth < 1.2 ? 0 : height - axisSize;
				for (const tick of layer.values) {
					const pos = Math.floor(screenMapX(tick)) + 0.5;
					context.moveTo(pos, start);
					context.lineTo(pos, height - (1 - layer.weight) * axisSize);
					if (layer.depth <= 1) {
						context.fillText(layer.format(tick), pos + textOffset, height);
					}
				}
			}
			context.stroke();
		}
		context.restore();

		// separator line
		context.beginPath();
		context.fillStyle = 'black';
		if (vertical) {
			context.rect(axisSize - 1, 0, 1, height);
		} else {
			context.rect(0, height - axisSize, width, 1);
		}
		context.fill();
	};

	const drawWaveform = (context: CanvasRenderingContext2D, sample: Sample) => {
		context.save();
		context.beginPath();
		context.rect(axisSize, 0, width - axisSize, height - axisSize);
		context.clip();

		context.beginPath();
		context.strokeStyle = 'black';
		context.lineWidth = strokeWidth;
		context.fillStyle = 'black';
		context.lineJoin = 'round';

		const stroke = strokeWidth / 2;

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

	const draw = (context: CanvasRenderingContext2D, sample: Sample) => {
		context.fillStyle = 'rgb(255 255 255)';
		context.fillRect(0, 0, width, height);

		drawAxis(context, span.x, false);
		drawAxis(context, span.y, true);

		drawWaveform(context, sample);
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
	onwheel={(e) => {
		e.preventDefault();
		const shiftKey = e.shiftKey;
		if ((isInBody(localMousePos) && shiftKey) || isInVerticalAxis(localMousePos)) {
			const yPos = mappedMousePos.y;
			const deltaY = e.deltaY;
			const scaleY = Math.exp(-deltaY / 100);
			if (onZoom) {
				onZoom({ x: 1, y: deltaY }, mappedMousePos);
			} else {
				span = span2dFromSpans(span.x, span.y.scale(scaleY, yPos));
			}
		} else {
			const xPos = mappedMousePos.x;
			const deltaY = e.deltaY;
			const scaleX = Math.exp(-deltaY / 100);
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
			if (onMove) {
				onMove(mappedDelta, mappedMousePos);
			} else {
				span = span.move(-mappedDelta.x, mappedDelta.y);
			}
		}
	})}
></canvas>
