<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import { chirpSample, phaseNoise, pinkNoiseSample, whiteNoiseSample } from '$lib/dsp/samples';
	import { clamp } from '$lib/math/clamp';
	import { isClose } from '$lib/math/float';
	import { point } from '$lib/math/point';
	import { span1d, span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import Button from '../input/Button.svelte';
	import AudioFileInput from './AudioFileInput.svelte';
	import PlayerComponent from './PlayerComponent.svelte';
	import Recorder from './Recorder.svelte';

	let {
		data = $bindable(new SampleData()),
		filteredData,
		span = $bindable(span2d(0, 1, -1, 1)),
		onData
	}: {
		data?: SampleData;
		filteredData?: SampleData;
		span?: Span2D;
		onData?: (sample: SampleData) => void;
	} = $props();
</script>

<div>
	<PlayerComponent {data} {filteredData} bind:span>
		{#snippet before()}
			<AudioFileInput
				onData={(sample) => {
					data = sample;
					onData?.(sample);
					const sampleSpan = sample.span();
					const vertical = Math.max(Math.abs(sampleSpan.y.min), Math.abs(sampleSpan.y.max));
					span = span2dFromSpans(sampleSpan.x, span1d(-vertical, vertical));
				}}
			/>

			<Recorder
				onData={(sample) => {
					data = sample;
					onData?.(sample);
				}}
			/>
		{/snippet}
		<div class="spacer"></div>

		<Button
			onclick={() => {
				data = chirpSample(20, 2000);
				onData?.(data);
			}}
			>Chirp
		</Button>
		<Button
			onclick={() => {
				data = whiteNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}
			>Noise
		</Button>
		<Button
			onclick={() => {
				data = pinkNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}
			>Pink noise
		</Button>
		<Button
			onclick={() => {
				data = phaseNoise(4 * DEFAULT_AUDIO_SAMPLERATE);
				onData?.(data);
			}}
			>Random phase
		</Button>
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
