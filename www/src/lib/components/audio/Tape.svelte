<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { span1d, type Span2D } from '$lib/geometry/geometry';
	import AudioFileInput from './AudioFileInput.svelte';
	import Player from './Player.svelte';
	import Recorder from './Recorder.svelte';

	let {
		span = $bindable(),
		onData,
		onMouse
	}: {
		span: Span2D;
		onData?: (sample: SampleData) => void;
		onMouse?: () => void;
	} = $props();

	let data: SampleData = $state(new SampleData());
</script>

<div>
	<Player
		{data}
		bind:span={() => span,
		(newSpan) => {
			span = newSpan.copy();
			span.x = newSpan.x.intersect(span1d(0, data.duration() * 1.1));
		}}
	>
		<AudioFileInput {onData} />

		<Recorder
			onData={(sample) => {
				data = sample;
				onData?.(sample);
			}}
		/>
	</Player>
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 2px;
	}
</style>
