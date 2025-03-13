<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import { span2d, type Span2D } from '$lib/math/geometry';
	import type { MouseStateHandler } from '$lib/input/mouse';
	import type { Snippet } from 'svelte';
	import Axis from './Axis.svelte';
	import Waveform from './Waveform.svelte';
	import { Player } from '$lib/audio/player';

	let {
		data,
		span = $bindable(),
		onmouse,
		children
	}: {
		data: Sample;
		span: Span2D;
		onmouse?: MouseStateHandler;
		children?: Snippet;
	} = $props();
</script>

<div>
	<div class="player">
		<Axis
			length={200}
			span={span.y}
			vertical
			onScale={(verticalSpan) => {
				if (verticalSpan.size() < 1e-12) {
					return;
				}
				span = span2d(span.x.min, span.x.max, verticalSpan.min, verticalSpan.max);
			}}
		/>
		<Waveform
			{data}
			{span}
			onMouse={(state) => {
				if (state.down) {
					span = span.move(-state.delta.x, -state.delta.y);
				}
			}}
		/>
		<div></div>
		<Axis
			length={400}
			span={span.x}
			onScale={(horizontalSpan) => {
				if (horizontalSpan.size() < 1 / DEFAULT_AUDIO_SAMPLERATE) {
					return;
				}
				span = span2d(horizontalSpan.min, horizontalSpan.max, span.y.min, span.y.max);
			}}
		/>
	</div>
	<div class="buttons">
		{@render children?.()}
		<button
			onclick={() => {
				const player = new Player();
				player.play(new SampleData(data));
			}}
		>
			Play
		</button>
	</div>
</div>

<style lang="less">
	.player {
		display: grid;
		grid-template-columns: 40px 400px;
		grid-template-rows: 200px 40px;
	}

	.buttons {
		display: flex;
		gap: 6px;
	}
</style>
