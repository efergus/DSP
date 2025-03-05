<script lang="ts">
	import { axisLines } from '$lib/audio/draw';
	import { span1d, span2d, type Span1D } from '$lib/geometry/geometry';
	import { mouse } from '$lib/input/mouse';

	let {
		length,
		width = 40,
		density = 2,
		span,
		limits,
		vertical = false,
		onScale
	}: {
		length: number;
		width?: number;
		density?: number;
		span: Span1D;
		limits?: Span1D;
		vertical?: boolean;
		onScale?: (span: Span1D) => void;
	} = $props();

	let mousePos = $state(0);

	const spanWidth = $derived(span.max - span.min);

	const lineLocations = $derived(axisLines(span, density, length));
	const lines = $derived(
		lineLocations.map((line) => {
			const center = line.depth > 0 && line.index % 5 === 0 && line.index % 2 !== 0;
			const effectiveDepth = line.depth * 2 + (center ? 0 : 1);
			const intensity = 255 - 220 / effectiveDepth;
			return {
				...line,
				color: `rgb(${intensity} ${intensity} ${intensity})`,
				width: (width * 0.8 * 1.5) / (effectiveDepth + 0.5),
				pos: line.pos,
				depth: effectiveDepth
			};
		})
	);
	const viewBox = $derived(vertical ? `0 0 ${width} ${length}` : `0 0 ${length} ${width}`);

	// $inspect(span, lineLocations);
	// $inspect(span);
</script>

<svg
	{viewBox}
	stroke-linecap="round"
	font-size="12"
	{...mouse(
		(state) => {
			mousePos = vertical ? state.pos.y : state.pos.x;
		},
		{
			remap: span2d(span.min, span.max, span.min, span.max)
		}
	)}
	onwheel={(event) => {
		event.preventDefault();
		let apxDeltaPixels = -event.deltaY * 10 ** event.deltaMode;
		const factor = Math.exp(-apxDeltaPixels / 100);
		let newScale = span.scale(factor, mousePos);
		if (limits) {
			newScale = limits;
		}
		onScale?.(newScale);
	}}
>
	{#if vertical}
		<g>
			{#each lines as line}
				<line
					stroke={line.color}
					x1={width - line.width}
					x2={width}
					y1={length - line.pos}
					y2={length - line.pos}
				></line>
			{/each}
		</g>
		<g dominant-baseline="hanging">
			{#each lines as line}
				{#if line.depth <= 1}
					<text x="0" y={length - line.pos + 2}>
						{line.label}
					</text>
				{/if}
			{/each}
		</g>
	{:else}
		<g>
			{#each lines as line}
				<line stroke={line.color} x1={line.pos} x2={line.pos} y1="0" y2={line.width}></line>
			{/each}
		</g>
		<g>
			{#each lines as line}
				{#if line.depth <= 1}
					<text x={line.pos + 2} y={width - 2}>
						{line.label}
					</text>
				{/if}
			{/each}
		</g>
	{/if}
</svg>
