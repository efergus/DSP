<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { chirp_sample } from '$lib/dsp/samples';
	import { span1d, type Span2D } from '$lib/geometry/geometry';
	import AudioFileInput from './AudioFileInput.svelte';
	import PlayerComponent from './PlayerComponent.svelte';
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
	<PlayerComponent
		{data}
		bind:span={() => span,
		(newSpan) => {
			span = newSpan.copy();
			span.x = newSpan.x.intersect(span1d(0, data.duration()));
		}}
	>
		<AudioFileInput
			onData={(sample) => {
				data = sample;
				onData?.(sample);
			}}
		/>

		<Recorder
			onData={(sample) => {
				data = sample;
				onData?.(sample);
			}}
		/>

		<button
			onclick={() => {
				data = chirp_sample(20, 2000);
				onData?.(data);
			}}>Chirp</button
		>
	</PlayerComponent>
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 2px;
	}
</style>
