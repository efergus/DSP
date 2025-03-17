<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import { chirp_sample, phaseNoise, pinkNoiseSample, whiteNoiseSample } from '$lib/dsp/samples';
	import { span1d, type Span2D } from '$lib/math/geometry';
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
			span.x = newSpan.x.intersect(span1d(0, Math.max(data.duration(), 1)));
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
		<button
			onclick={() => {
				data = whiteNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}>Noise</button
		>
		<button
			onclick={() => {
				data = pinkNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}>Pink noise</button
		>
		<button
			onclick={() => {
				data = phaseNoise(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}>Random phase</button
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
