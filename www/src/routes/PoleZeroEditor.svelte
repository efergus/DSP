<script lang="ts">
	import { type Complex } from '$lib/dsp/complex';
	import PoleZeroPlot from './PoleZeroPlot.svelte';
	import RootEditor from './RootEditor.svelte';
	import type { Root } from '$lib/dsp/iir';
	import { span2d, type Span2D } from '$lib/math/span';

	let {
		roots = $bindable([]),
		span = $bindable(),
		width = 250,
		height = 250,
		padding = 0.2,
		zPlane = false
	}: {
		roots: Root[];
		span: Span2D;
		width?: number;
		height?: number;
		padding?: number;
		zPlane?: boolean;
	} = $props();

	let hover: number | null = $state(null);
	let active: number | null = $state(null);
</script>

<div>
	<PoleZeroPlot
		bind:roots={() => roots, (value) => (roots = value)}
		bind:hover
		bind:active
		{span}
		{width}
		{height}
		{zPlane}
	/>
	<!-- <div>
		{#each roots as _, index}
			<RootEditor
				polar={zPlane}
				bind:value={() => roots[index],
				(value) => {
					const newRoots = [...roots];
					newRoots[index] = value;
					roots = newRoots;
				}}
				hovered={hover === index}
				onenter={() => {
					hover = index;
				}}
				onleave={() => {
					hover = null;
				}}
				onfocus={() => {
					active = index;
				}}
			/>
		{/each}
	</div> -->
</div>

<style lang="less">
	div {
		display: flex;
		gap: 0.5em;
	}

	div > div {
		flex-direction: column;
		max-width: 300px;
	}
</style>
