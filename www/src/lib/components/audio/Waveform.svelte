<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, type AudioSample } from '$lib/audio/sample';
	import { span2d, type Point, type Span2D } from '$lib/geometry/geometry';
	import { mouse, type MouseState } from '$lib/input/state';

	export type LocalMouseState = {
		local: Point;
	} & MouseState;

	let {
		data,
		span = span2d(0, 1, -1, 1),
		width = 400,
		height = 200,
		cursor = 0,
		samplerate = DEFAULT_AUDIO_SAMPLERATE,
		onwheel = () => {},
		onmouse = () => {}
	}: {
		data: AudioSample;
		span?: Span2D;
		samplerate?: number;
		width?: number;
		height?: number;
		cursor?: number;
		onwheel?: (delta: { x: number; y: number }, e: WheelEvent) => void;
		onmouse?: (state: LocalMouseState) => void;
	} = $props();

	let canvas: HTMLCanvasElement;

	const draw = (context: CanvasRenderingContext2D, sample: AudioSample) => {
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
		const verticalSpan = span.y.max - span.y.min;

		let sampleStartIndex = Math.max(Math.floor(sampleStart), 0);
		const sampleEndIndex = Math.min(Math.ceil(sampleEnd), sample.length);

		const h2 = Math.ceil(height / 2);

		if (sampleSpan > width * 2) {
			context.lineWidth = 1;

			const chunkStride = Math.ceil(sampleSpan / width);
			sampleStartIndex = sampleStartIndex - (sampleStartIndex % chunkStride);
			for (let chunk = 0; chunk < width; chunk++) {
				const base = sampleStartIndex + chunk * chunkStride;
				if (base >= sample.length) {
					break;
				}
				const val = sample.getFrame(base);
				let min = val;
				let max = val;
				for (let index = 0; index < chunkStride && base + index < sampleEndIndex; index++) {
					const val = sample.getFrame(base + index);
					min = Math.min(min, val);
					max = Math.max(max, val);
				}

				const rectY = h2 - Math.ceil((max / verticalSpan) * height);
				const rectH = Math.ceil(((max - min) / verticalSpan) * height);
				context.fillRect(chunk, rectY, 1, rectH);
			}
		} else {
			for (let index = sampleStartIndex; index < sampleEndIndex; index++) {
				const x = (index - sampleStart) / sampleSpan;
				const y = sample.getFrame(index) / verticalSpan;
				context.lineTo(x * width, (-y * height) / 2 + height / 2);
			}
			context.stroke();
		}
	};

	$effect(() => {
		const context = canvas?.getContext('2d');
		if (!context) {
			return;
		}
		draw(context, data);
	});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	onwheel={(e) => onwheel({ x: e.deltaX, y: e.deltaY }, e)}
	{...mouse((state) => {})}
></canvas>
