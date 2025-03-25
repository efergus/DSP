<script lang="ts">
	import type { SampleData } from '$lib/audio/sample';
	import { context } from '$lib/dsp/dsp';
	import { apply_hann_window } from '$lib/dsp/window';
	import { debounce } from '$lib/input/debounce';
	import { point } from '$lib/math/point';
	import { span1d, span2d, type Span2D } from '$lib/math/span';
	import { onMount } from 'svelte';

	let {
		data,
		span = $bindable(span2d(0, 1, -1, 1)),
		width = 500,
		height = 250,
		scale = 1,
		cursor = 0,
		logScale = false,
		onwheel = () => {}
	}: {
		data: SampleData;
		span?: Span2D;
		width?: number;
		height?: number;
		scale?: number;
		cursor?: number;
		logScale?: boolean;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
	} = $props();
	const sampleSize = 512;
	const fftSize = 1024;
	const overlap = 256;

	const samplerate = $derived(data.samplerate);
	const stride = $derived(sampleSize - overlap);
	const screenSpan = $derived(span2d(0, width, 0, height));
	let canvas: HTMLCanvasElement;
	let currentSample: SampleData = $state(data);
	let frequencyData: Float32Array[] = $state([]);
	let peaks: number[] = $state([]);
	let timeout: NodeJS.Timeout | null = $state(null);
	let drawn: Span2D | null = $state(null);
	let fft_context = context();
	let updateVersion = $state(-1);

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

	const drawSpectrogramData = () => {
		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}
		context.clearRect(0, 0, width, height);

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
				const pos = screenSpan.remap(point(x, y), span);
				const frequencyX = Math.floor((pos.x * samplerate) / stride);
				const frequencyY = Math.floor((pos.y * fftSize) / 2);
				if (
					frequencyX < 0 ||
					frequencyX >= frequencyData.length ||
					frequencyY < 0 ||
					frequencyY >= frequencyData[frequencyX].length
				) {
					continue;
				}
				const value = frequencyData[frequencyX][frequencyY];
				const mappedValue = logScale ? Math.log(value) : value;
				const mapped = Math.max(0, Math.floor(range.remap(mappedValue, mapping)));
				setPixel(x, y, mapped, mapped, mapped);
			}
		}
		context.putImageData(image, 0, 0);
		updateVersion = data.updateVersion;
		drawn = span;
	};

	const updateSpectrogram = debounce((span: Span2D, updateVersion: number) => {
		if (span !== drawn || updateVersion !== data.updateVersion) {
			updateSpectrogramData();
			drawSpectrogramData();
		}
	}, 100);

	$effect(() => {
		updateSpectrogram(span, data.updateVersion);
	});

	onMount(() => {
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
	{width}
	{height}
	onwheel={(e) => onwheel({ x: e.deltaX, y: e.deltaY }, e)}
></canvas>
