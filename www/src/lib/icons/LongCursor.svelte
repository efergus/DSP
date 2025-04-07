<script lang="ts">
	import type { LongCursorPathProps } from './long_cursor_path';
	import LongCursorPath from './LongCursorPath.svelte';

	const {
		span,
		...pathProps
	}: LongCursorPathProps & {
		x: number | null;
	} = $props();

	const width = $derived(span.x.size());
	const height = $derived(span.y.size());
</script>

{#if pathProps.x !== null}
	<svg
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		version="1.1"
		xmlns="http://www.w3.org/2000/svg"
		fill={pathProps.color}
		stroke="none"
		stroke-width={pathProps.stroke}
		stroke-linecap="butt"
		stroke-linejoin="round"
		style:position="absolute"
		style:top={`${span.y.min}px`}
		style:left={`${span.x.min}px`}
		style:pointer-events="none"
	>
		<LongCursorPath {...pathProps} {span} />
	</svg>
{/if}
