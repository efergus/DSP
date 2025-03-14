<script lang="ts">
	import { axisLines, axisLines2 } from '$lib/audio/draw';
	import { span1d, span2d, type Span1D } from '$lib/math/geometry';
	import { mouse } from '$lib/input/mouse';
	import { clamp } from '$lib/math/clamp';

	let {
		length,
		width = 40,
		density = 2.2,
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

	const lineLocations = $derived(axisLines(span, density));
	const lines = $derived(
		Array.from(
			lineLocations.map((line) => {
				// const center = line.index % 5 === 0 && line.index % 2 !== 0;
				// const effectiveDepth = Math.max(line.depth + (center ? 0 : clamp(2 - line.depth) * 0.5), 0);
				const effectiveDepth = Math.max(line.depth, 0);
				const intensity = Math.max((255 * effectiveDepth) / density, 0);
				return {
					...line,
					color: `rgb(${intensity} ${intensity} ${intensity})`,
					width: (width * 0.8) / Math.max((effectiveDepth - 0.2) * 2, 0.5),
					pos: line.pos * length,
					depth: effectiveDepth
				};
			})
		)
	);
	const viewBox = $derived(vertical ? `0 0 ${width} ${length}` : `0 0 ${length} ${width}`);

	$inspect(span, lineLocations);
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
		let newSpan = span.scale(factor, mousePos);
		onScale?.(newSpan);
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
					<text x={line.pos + 2} y={width - 2} class="noselect" opacity={1 - line.depth ** 4}>
						{line.label}
					</text>
				{/if}
			{/each}
		</g>
	{/if}
</svg>
