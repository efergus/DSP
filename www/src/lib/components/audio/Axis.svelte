<script lang="ts">
	import { axisLines, axisLines2, axisLines3 } from '$lib/audio/axes';
	import { span1d, span2d, type Span1D } from '$lib/math/span';
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

	const screenSpan = $derived(span1d(0, length));
	const lineLocations = $derived(
		Array.from(axisLines3(span, density)).map((spec) => ({
			depth: spec.depth,
			magnitude: spec.magnitude,
			format: spec.format,
			values: Array.from(spec.values)
		}))
	);
	const lines = $derived(
		lineLocations.flatMap((group) => {
			const intensity = Math.max((255 * group.depth) / density, 0);
			const color = `rgb(${intensity} ${intensity} ${intensity})`;
			const length = (width * 0.8) / Math.max((group.depth - 0.2) * 2, 0.5);
			return group.values.map((value) => ({
				color,
				length,
				depth: group.depth,
				value,
				pos: span.remap(value, screenSpan),
				format: group.format
			}));
		})
	);
	const viewBox = $derived(vertical ? `0 0 ${width} ${length}` : `0 0 ${length} ${width}`);

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
			remap: span2d(span.start, span.end, span.start, span.end)
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
					x1={width - line.length}
					x2={width}
					y1={length - line.pos}
					y2={length - line.pos}
				></line>
			{/each}
		</g>
		<g dominant-baseline="hanging">
			{#each lines as line}
				{#if line.depth <= 1}
					<text x="0" y={length - line.pos + 2} class="noselect" opacity={1 - line.depth ** 4}>
						{line.format(line.value)}
					</text>
				{/if}
			{/each}
		</g>
	{:else}
		<g>
			{#each lines as line}
				<line stroke={line.color} x1={line.pos} x2={line.pos} y1="0" y2={line.length}></line>
			{/each}
		</g>
		<g>
			{#each lines as line}
				{#if line.depth <= 1}
					<text x={line.pos + 2} y={width - 2} class="noselect" opacity={1 - line.depth ** 4}>
						{line.format(line.value)}
					</text>
				{/if}
			{/each}
		</g>
	{/if}
</svg>
