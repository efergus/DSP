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

			const stride = Math.ceil(sampleSpan / width);
			sampleStartIndex = sampleStartIndex - (sampleStartIndex % stride);
			const samples = new Float32Array(stride);
			for (let chunk = 0; chunk < width; chunk++) {
				const base = sampleStartIndex + chunk * stride;
				if (base >= sample.length) {
					break;
				}
				let index = 0;
				for (; index < stride && base + index < sampleEndIndex; index++) {
					samples[index] = sample.getFrame(base + index);
				}
				samples.fill(0, index);

				samples.sort();
				const min = samples[0];
				const max = samples[stride - 2];
				// calculate quartiles
				const quart = stride / 4;
				const q1 = (samples[Math.floor(quart)] + samples[Math.ceil(quart)]) / 2;
				const q3 = (samples[Math.floor(quart * 3)] + samples[Math.ceil(quart * 3)]) / 2;

				let rectY = h2 + Math.ceil((min / verticalSpan) * height);
				let rectH = Math.ceil(((max - min) / verticalSpan) * height);
				context.fillStyle = 'rgb(120 120 255)';
				context.fillRect(chunk, rectY, 1, rectH);

				rectY = h2 + Math.ceil((q1 / verticalSpan) * height);
				rectH = Math.ceil(((q3 - q1) / verticalSpan) * height);
				context.fillStyle = 'rgb(0 120 0)';
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
