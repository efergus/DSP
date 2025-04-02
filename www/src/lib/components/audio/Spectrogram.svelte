<script lang="ts">
	import type { SampleData } from '$lib/audio/sample';
	import { context } from '$lib/dsp/dsp';
	import { apply_hann_window } from '$lib/dsp/window';
	import { drawAxes } from '$lib/graphics/axes';
	import { debounce, throttle } from '$lib/input/debounce';
	import { mouse } from '$lib/input/mouse';
	import { clamp } from '$lib/math/clamp';
	import { Point, point } from '$lib/math/point';
	import { span1d, span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import { onMount } from 'svelte';

	let {
		data,
		span = $bindable(span2d(0, 1, -1, 1)),
		width = 500,
		height = 200,
		scale = 1,
		axisSizeX = 36,
		axisSizeY = 48,
		cursor = 0,
		logScale = false,
		onwheel = () => {}
	}: {
		data: SampleData;
		span?: Span2D;
		width?: number;
		height?: number;
		scale?: number;
		axisSizeX?: number;
		axisSizeY?: number;
		cursor?: number;
		logScale?: boolean;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();
	const sampleSize = 512;
	const fftSize = 1024;
	const overlap = 256;

	const samplerate = $derived(data.samplerate);
	const stride = $derived(sampleSize - overlap);
	const screenSpan = $derived(span2d(axisSizeY, width, axisSizeX, height));
	let styleSize = $state(point(width, height));
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
	const yLimits = $derived(span1d(0, samplerate / 2));

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

	const drawSpectrogramData = (context: CanvasRenderingContext2D) => {
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
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const pos = localScreenSpan.remap(point(x, y), span);
				const frequencyX = clamp(
					Math.floor((pos.x * samplerate) / stride),
					0,
					frequencyData.length - 1
				);
				if (!span.y.contains(pos.y)) {
					continue;
				}
				const frequencyY = Math.floor((pos.y * fftSize) / samplerate);
				const value = frequencyData[frequencyX][frequencyY];
				const mappedValue = logScale ? Math.log(value) : value;
				const mapped = Math.max(0, Math.floor(range.remap(mappedValue, mapping)));
				setPixel(x, y, mapped, mapped, mapped);
			}
		}
		context.putImageData(image, axisSizeY, 0);
		updateVersion = data.updateVersion;
		drawn = span;
	};

	const updateSpectrogramThrottled = throttle((span: Span2D, updateVersion: number) => {
		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}
		if (span !== drawn || updateVersion !== data.updateVersion) {
			context.clearRect(0, 0, width, height);
			drawAxes(context, { span, sizeX: axisSizeX, sizeY: axisSizeY });
			updateSpectrogramData();
			drawSpectrogramData(context);
		}
	}, 100);

	const updateSpectrogramDebounced = debounce(updateSpectrogramThrottled, 100);

	$effect(() => {
		updateSpectrogramDebounced(span, data.updateVersion);
	});

	onMount(() => {
		const pixelRatio = window.devicePixelRatio;
		styleSize = point(width * pixelRatio, height * pixelRatio);

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

<canvas
	bind:this={canvas}
	style:width={`${styleSize.x}px`}
	style:height={`${styleSize.y}px`}
	{width}
	{height}
	onwheel={(e) => {
		e.preventDefault();
		const scale = Math.exp(-e.deltaY / 100);
		if (isInHorizontalAxis(localMousePos)) {
			span = span2dFromSpans(span.x.scale(scale, mappedMousePos.x), span.y);
		} else {
			span = span2dFromSpans(span.x, span.y.scale(scale, mappedMousePos.y).intersect(yLimits));
		}
		updateSpectrogramThrottled(span, data.updateVersion);
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
			if (span.y.max + mappedDelta.y > yLimits.max) {
				mappedDelta.y = yLimits.max - span.y.max;
			}
			if (span.y.min + mappedDelta.y < yLimits.min) {
				mappedDelta.y = yLimits.min - span.y.min;
			}
			span = span.move(-mappedDelta.x, mappedDelta.y);
			updateSpectrogramThrottled(span, data.updateVersion);
		}
	})}
></canvas>
