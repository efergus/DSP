<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import { chirpSample, phaseNoise, pinkNoiseSample, whiteNoiseSample } from '$lib/dsp/samples';
	import { clamp } from '$lib/math/clamp';
	import { isClose } from '$lib/math/float';
	import { point } from '$lib/math/point';
	import { span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import Button from '../input/Button.svelte';
	import AudioFileInput from './AudioFileInput.svelte';
	import PlayerComponent from './PlayerComponent.svelte';
	import Recorder from './Recorder.svelte';

	let {
		data = $bindable(new SampleData()),
		span = $bindable(span2d(0, 1, -1, 1)),
		limits,
		minDuration,
		onData,
		onMouse
	}: {
		data?: SampleData;
		span?: Span2D;
		minDuration?: number;
		limits?: Span2D;
		onData?: (sample: SampleData) => void;
		onMouse?: () => void;
	} = $props();

	let effectiveMinDuration = $derived(minDuration ?? 1 / data.samplerate);
	let effectiveLimits = $derived(
		limits ?? span2d(0, Math.max(data.duration(), span.x.size(), 1), -100, 100)
	);
</script>

<div>
	<PlayerComponent {data} bind:span>
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
