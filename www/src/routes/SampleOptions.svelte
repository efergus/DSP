<script lang="ts">
	import Button from '$lib/components/input/Button.svelte';
	import { SAMPLE_TYPES, SampleType } from '$lib/state/sample_selector';
	import SinWave from '$lib/icons/SinWave.svelte';
	import SquareWave from '$lib/icons/SquareWave.svelte';
	import SawWave from '$lib/icons/SawWave.svelte';
	import TriangleWave from '$lib/icons/TriangleWave.svelte';
	import WhiteNoise from '$lib/icons/WhiteNoise.svelte';
	import Chirp from '$lib/icons/Chirp.svelte';
	import {
		chirpSample,
		pinkNoiseSample,
		sawSample,
		sinSample,
		squareSample,
		triangleSample
	} from '$lib/dsp/samples';
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData } from '$lib/audio/sample';
	import Slider from '$lib/components/input/Slider.svelte';
	import { throttle } from '$lib/input/debounce';
	import LabeledSlider from '$lib/components/input/LabeledSlider.svelte';

	let {
		sampleType = SampleType.SINE,
		onData
	}: {
		sampleType?: SampleType;
		onData?: (sample: SampleData) => void;
	} = $props();

	let frequency = $state(440);
	let end_frequency = $state(4000);
	let amplitude = $state(50);
	let duration = $state(4);
	let samplerate = $state(DEFAULT_AUDIO_SAMPLERATE);
	let falloff = $state(0.0);

	const sample_names = new Map(
		SAMPLE_TYPES.map((sample_type) => [sample_type.type, sample_type.name])
	);

	const setSample = (
		sample_type: SampleType,
		frequency: number,
		end_frequency: number,
		duration: number,
		amplitude: number,
		falloff: number
	) => {
		let sample: SampleData | undefined;
		switch (sample_type) {
			case SampleType.SINE:
				sample = sinSample(frequency, samplerate, duration * samplerate, amplitude);
				break;
			case SampleType.SQUARE:
				sample = squareSample(frequency, samplerate, duration * samplerate, amplitude);
				break;
			case SampleType.SAWTOOTH:
				sample = sawSample(frequency, samplerate, duration * samplerate, amplitude);
				break;
			case SampleType.TRIANGLE:
				sample = triangleSample(frequency, samplerate, duration * samplerate, amplitude);
				break;
			case SampleType.NOISE:
				sample = pinkNoiseSample(duration * samplerate, falloff, amplitude);
				break;
			case SampleType.CHIRP:
				sample = chirpSample(
					frequency,
					end_frequency,
					samplerate,
					duration * samplerate,
					amplitude
				);
				break;
		}
		if (sample) {
			onData?.(sample);
		}
	};

	const throttledSetSample = throttle(setSample, 200);

	$effect(() => {
		throttledSetSample(sampleType, frequency, end_frequency, duration, amplitude / 100, falloff);
	});
</script>

<div class="box">
	<h3>{sample_names.get(sampleType)}</h3>
	<div class="stack">
		{#if sampleType !== SampleType.NOISE}
			<LabeledSlider
				label="Frequency:"
				units="Hz"
				bind:value={frequency}
				min={10}
				max={20000}
				log
			/>
		{/if}
		{#if sampleType === SampleType.CHIRP}
			<LabeledSlider
				label="Final Frequency:"
				units="Hz"
				bind:value={end_frequency}
				min={10}
				max={20000}
				log
			/>
		{/if}
		{#if sampleType === SampleType.NOISE}
			<LabeledSlider label="Falloff:" units="" bind:value={falloff} min={0} max={1} step={0.01} />
		{/if}
		<LabeledSlider label="Amplitude:" units="%" bind:value={amplitude} min={0} max={100} step={1} />
		<LabeledSlider
			label="Duration:"
			units="s"
			bind:value={duration}
			min={0.1}
			max={10}
			step={0.1}
		/>
	</div>
</div>

<style lang="less">
	div.box {
		margin-top: 16px;
	}

	div.stack {
		display: grid;
		grid-template-columns: 10ch 1fr 8ch 2ch;
		grid-auto-rows: minmax(2em, auto);
		align-items: center;
		gap: 6px;
	}

	p {
		text-align: right;
	}
</style>
