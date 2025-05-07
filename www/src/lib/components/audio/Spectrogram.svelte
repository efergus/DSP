<script lang="ts">
	import type { SampleData } from '$lib/audio/sample';
	import { context } from '$lib/dsp/dsp';
	import { apply_hann_window } from '$lib/dsp/window';
	import { drawAxes } from '$lib/graphics/axes';
	import LongCursor from '$lib/icons/LongCursor.svelte';
	import { debounce, throttle } from '$lib/input/debounce';
	import { mouseDispatch } from '$lib/input/mouse';
	import { clamp } from '$lib/math/clamp';
	import { Point, point } from '$lib/math/point';
	import { span1d, span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import { onMount } from 'svelte';

	let {
		data,
		span = $bindable(span2d(0, 1, -1, 1)),
		cursor = $bindable(null),
		cursorY = $bindable(null),
		width = 500,
		height = 200,
		scale = 1,
		axisSizeX = 36,
		axisSizeY = 48,
		logScale = false,
		playing = false,
		onwheel = () => {}
	}: {
		data: SampleData;
		span?: Span2D;
		width?: number;
		height?: number;
		scale?: number;
		axisSizeX?: number;
		axisSizeY?: number;
		cursor?: number | null;
		cursorY?: number | null;
		logScale?: boolean;
		playing?: boolean;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();
	const sampleSize = 512;
	const fftSize = 1024;
	const overlap = 256;

	let styleSize = $state(point(width, height));
	let canvasSize = $state(point(width, height));

	const samplerate = $derived(data.samplerate);
	const stride = $derived(sampleSize - overlap);
	const frequencySpan = $derived(span1d(span.y.start * samplerate, span.y.end * samplerate));
	const screenSpan = $derived(span2d(axisSizeY, canvasSize.x, canvasSize.y - axisSizeX, 0));
	const interiorScreenSpan = $derived(span2d(0, screenSpan.x.size(), 0, screenSpan.y.size()));
	let canvas: HTMLCanvasElement;
	let currentSample: SampleData = $state(data);
	let frequencyData: Float32Array[] = $state([]);
	let peaks: number[] = $state([]);
	let timeout: NodeJS.Timeout | null = $state(null);
	let drawn: Span2D | null = $state(null);
	let fft_context = context();
	let updateVersion = $state(-1);

	let localMousePos = $state(point());
	let mappedMousePos = $state(point());
	const yLimits = $derived(span1d(-0.5, 0.5));
	let performanceSensitive = $state(false);

	const cursorX = $derived(
		cursor === null ? null : span.x.remapClamped(cursor, interiorScreenSpan.x)
	);

	const isInVerticalAxis = $derived(
		(pos: Point) => pos.x <= axisSizeY && pos.y < height - axisSizeX
	);
	const isInHorizontalAxis = $derived(
		(pos: Point) => pos.x > axisSizeY && pos.y >= height - axisSizeX
	);
	const isInBody = $derived((pos: Point) => pos.x > axisSizeY && pos.y < height - axisSizeX);

	const updateSpectrogramData = () => {
		// update spectrogram data with any new data in the sample
		let startIndex = 0;
		let endIndex = Math.max(0, Math.floor((data.length - sampleSize) / stride) + 1);
		if (data === currentSample) {
			startIndex = frequencyData.length;
		} else {
			currentSample = data;
			frequencyData = [];
			peaks = [];
		}

		const dataBuffer = new Float32Array(fftSize);
		for (let index = startIndex; index < endIndex; index++) {
			const start = index * stride;
			for (let bufferIndex = 0; bufferIndex < sampleSize; bufferIndex++) {
				dataBuffer[bufferIndex] = data.get(start + bufferIndex);
			}
			apply_hann_window(dataBuffer, sampleSize);
			const fftBuffer = fft_context.fft_norm(dataBuffer);
			const max = Math.max(...fftBuffer);
			const min = Math.min(...fftBuffer);
			peaks[index] = max;
			frequencyData[index] = fftBuffer;
		}
	};

	const drawSpectrogramData = async (context: CanvasRenderingContext2D) => {
		const width = screenSpan.x.size();
		const height = screenSpan.y.size();
		const localScreenSpan = span2d(0, width, 0, height);

		const image = context.createImageData(width, height);
		const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
			const idx = ((height - y - 1) * width + x) * 4;
			image.data[idx] = r;
			image.data[idx + 1] = g;
			image.data[idx + 2] = b;
			image.data[idx + 3] = 255;
		};
		let peak = 0;
		for (let x = 0; x < width; x++) {
			const pos = screenSpan.x.remap(x, span.x);
			const frequencyX = Math.floor((pos * samplerate) / stride);
			if (frequencyX < 0 || frequencyX >= peaks.length) {
				continue;
			}
			peak = Math.max(peak, peaks[frequencyX]);
		}
		let range = logScale ? span1d(-10, Math.log(peak)) : span1d(0, peak);
		let mapping = span1d(0, 256);
		const chunkSize = Math.max(Math.ceil(width / 16), 32);
		let worstChunk = 0;
		const promises = [];
		for (let chunk = 0; chunk < width; chunk += chunkSize) {
			const fillChunk = () => {
				const drawStart = performance.now();

				for (let x = chunk; x < Math.min(width, chunk + chunkSize); x++) {
					for (let y = 0; y < height; y++) {
						const pos = localScreenSpan.remap(point(x, y), span);
						const frequencyX = clamp(
							Math.floor((pos.x * samplerate) / stride),
							0,
							frequencyData.length - 1
						);
						const frequencySlice = frequencyData[frequencyX];
						const frequencyY = Math.floor(Math.abs(pos.y * fftSize));
						if (frequencyY >= frequencySlice.length) {
							continue;
						}
						const value = frequencySlice[frequencyY];
						const mappedValue = logScale ? Math.log(value) : value;
						const mapped = Math.max(0, Math.floor(range.remap(mappedValue, mapping)));
						setPixel(x, y, mapped, mapped, mapped);
					}
				}
				const drawEnd = performance.now();
				const drawDelta = drawEnd - drawStart;
				worstChunk = Math.max(worstChunk, drawDelta);
			};
			const timeout = (chunk / chunkSize) * 2;
			promises.push(
				new Promise<void>((resolve) =>
					setTimeout(() => {
						fillChunk();
						resolve();
					}, timeout)
				)
			);
		}

		await Promise.all(promises);
		context.putImageData(image, axisSizeY, 0);
		updateVersion = data.updateVersion;
		drawn = span;
		if (worstChunk > 1000 / 30) {
			performanceSensitive = true;
		} else if (worstChunk < 1000 / 60) {
			performanceSensitive = false;
		}
	};

	const updateSpectrogramDirect = (span: Span2D, updateVersion: number) => {
		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}
		if (span !== drawn || updateVersion !== data.updateVersion) {
			context.clearRect(0, 0, axisSizeY, height - axisSizeX);
			context.clearRect(0, height - axisSizeX, width, axisSizeX);
			drawAxes(context, {
				span: span2dFromSpans(span.x, frequencySpan),
				sizeX: axisSizeX,
				sizeY: axisSizeY,
				maxInteriorDepth: -1
			});
			updateSpectrogramData();
			drawSpectrogramData(context);
		}
	};

	const updateSpectrogramThrottled = throttle(updateSpectrogramDirect, 100);
	const updateSpectrogramSlow = $derived(
		throttle(updateSpectrogramDirect, performanceSensitive ? 1000 : 100)
	);

	const updateSpectrogramDebounced = debounce(updateSpectrogramThrottled, 100);

	$effect(() => {
		if (playing) {
			updateSpectrogramSlow(span, data.updateVersion);
		} else {
			updateSpectrogramDebounced(span, data.updateVersion);
		}
	});

	onMount(() => {
		const pixelRatio = window.devicePixelRatio;
		console.log(pixelRatio);
		canvasSize = point(width * pixelRatio, height * pixelRatio);

		const updateSpectrogramLoop = () => {
			if (drawn && data.updateVersion !== updateVersion) {
				drawn = null;
				updateVersion = data.updateVersion;
			}
			timeout = setTimeout(updateSpectrogramLoop, 100);
		};
		updateSpectrogramLoop();
	});
</script>

<div>
	<canvas
		bind:this={canvas}
		style:width={`${styleSize.x}px`}
		style:height={`${styleSize.y}px`}
		width={canvasSize.x}
		height={canvasSize.y}
		onwheel={(e) => {
			e.preventDefault();
			const scale = Math.exp(-e.deltaY / 100);
			if (isInHorizontalAxis(localMousePos) || isInBody(localMousePos)) {
				span = span2dFromSpans(span.x.scale(scale, mappedMousePos.x), span.y);
			} else {
				span = span2dFromSpans(span.x, span.y.scale(scale, mappedMousePos.y).intersect(yLimits));
			}
			updateSpectrogramThrottled(span, data.updateVersion);
		}}
		{...mouseDispatch(({ pos, delta, down, leaveEvent }) => {
			localMousePos = pos;
			mappedMousePos = screenSpan.remap(pos, span);
			cursor = mappedMousePos.x;
			cursorY = mappedMousePos.y;
			if (down) {
				const mappedDelta = screenSpan.remapSize(delta, span);
				if (isInHorizontalAxis(localMousePos)) {
					mappedDelta.y = 0;
				}
				if (isInVerticalAxis(localMousePos)) {
					mappedDelta.x = 0;
				}
				if (span.y.max + mappedDelta.y > yLimits.max) {
					mappedDelta.y = yLimits.max - span.y.max;
				}
				if (span.y.min + mappedDelta.y < yLimits.min) {
					mappedDelta.y = yLimits.min - span.y.min;
				}
				span = span.move(-mappedDelta.x, mappedDelta.y);
				updateSpectrogramThrottled(span, data.updateVersion);
			}
			if (leaveEvent) {
				// cursor = null;
				cursorY = null;
			}
		})}
	></canvas>
	<div
		class="cursor"
		style:top="0px"
		style:left="0px"
		style:width={`${width}px`}
		style:height={`${height}px`}
	>
		{#if cursorX !== null}
			<LongCursor x={cursorX} size={8} span={screenSpan} />
		{/if}
		{#if cursorY !== null}
			<!-- Line to show location on Y axis -->
			<svg
				width={axisSizeY}
				height={height - axisSizeX}
				viewBox={`0 0 ${axisSizeY} {height - axisSizeX}`}
				stroke-width={1}
				stroke="currentColor"
				fill="none"
				style:position="absolute"
				style:top="0px"
				style:left="0px"
				style:pointer-events="none"
				style:width="{axisSizeY}px"
				style:height="{height - axisSizeX}px"
			>
				<line
					x1={axisSizeY / 2}
					y1={span.y.remap(cursorY, screenSpan.y)}
					x2={axisSizeY}
					y2={span.y.remap(cursorY, screenSpan.y)}
				/>
			</svg>
		{/if}
	</div>
</div>

<style>
	div {
		position: relative;
	}

	.cursor {
		position: absolute;
		pointer-events: none;
	}
</style>
