<script lang="ts">
	import type { AudioSample } from '$lib/audio/sample';
	import { span2d, span2dMove, type Span2D } from '$lib/geometry/geometry';
	import type { MouseStateHandler } from '$lib/input/mouse';
	import Axis from './Axis.svelte';
	import Waveform from './Waveform.svelte';

	let {
		data,
		span = $bindable(),
		onmouse
	}: {
		data: AudioSample;
		span: Span2D;
		onmouse?: MouseStateHandler;
	} = $props();

	let startSpan = $state(span2d());

	// let lastUpdate = $state(0);
	// let debouncedData =

	// const xAxisLines = $derived.by(() => {
	// 	const
	// });
</script>

<div class="player">
	<Axis
		length={200}
		span={span.y}
		vertical
		onScale={(verticalSpan) => {
			span = span2d(span.x.min, span.x.max, verticalSpan.min, verticalSpan.max);
		}}
	/>
	<Waveform
		{data}
		{span}
		onMouse={(state) => {
			// console.log(state.pos, state.pixelPos, state.delta);
			if (state.down) {
				span = span2dMove(span, -state.delta.x, -state.delta.y);
			}
		}}
	/>
	<div></div>
	<Axis
		length={400}
		span={span.x}
		onScale={(horizontalSpan) => {
			span = span2d(horizontalSpan.min, horizontalSpan.max, span.y.min, span.y.max);
		}}
	/>
</div>

<style lang="less">
	.player {
		display: grid;
		grid-template-columns: 40px 400px;
		grid-template-rows: 200px 40px;
	}
</style>
