<script lang="ts">
	import Button from '$lib/components/input/Button.svelte';
	import { SampleType } from '$lib/state/sample_selector';
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

	let {
		selected = $bindable(SampleType.SQUARE),
		onData
	}: {
		selected?: SampleType;
		onData?: (sample: SampleData) => void;
	} = $props();

	let frequency = $state(440);
	let end_frequency = $state(4000);
	let amplitude = $state(0.5);
	let duration = $state(4);
	let samplerate = $state(DEFAULT_AUDIO_SAMPLERATE);
	let falloff = $state(0.0);

	const sample_types = [
		{ type: SampleType.SINE, name: 'Sine Wave', icon: SinWave },
		{ type: SampleType.SQUARE, name: 'Square Wave', icon: SquareWave },
		{ type: SampleType.SAWTOOTH, name: 'Sawtooth Wave', icon: SawWave },
		{ type: SampleType.TRIANGLE, name: 'Triangle Wave', icon: TriangleWave },
		{ type: SampleType.NOISE, name: 'Noise', icon: WhiteNoise },
		{ type: SampleType.CHIRP, name: 'Chirp', icon: Chirp }
	];

	const sample_names = new Map(
		sample_types.map((sample_type) => [sample_type.type, sample_type.name])
	);

	const setSample = (
		sample_type: SampleType,
		frequency: number,
		end_frequency: number,
		duration: number,
		amplitude: number,
		falloff: number
	) => {
		selected = sample_type;
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
		throttledSetSample(selected, frequency, end_frequency, duration, amplitude, falloff);
	});
</script>

{#each sample_types as sample_type}
	<Button
		onclick={() => {
			selected = sample_type.type;
		}}
		class={selected === sample_type.type ? 'selected' : ''}
		title={sample_type.name}
	>
		<sample_type.icon />
	</Button>
{/each}

<div class="box">
	<h3>{sample_names.get(selected)}</h3>
	<div class="stack">
		<label for="frequency">Frequency:</label>
		<Slider id="frequency" bind:value={frequency} min={10} max={20000} step={1} />
		<p>{frequency} Hz</p>
		{#if selected === SampleType.CHIRP}
			<label for="end_frequency">End Frequency:</label>
			<Slider id="end_frequency" bind:value={end_frequency} min={10} max={20000} step={1} />
			<p>{end_frequency} Hz</p>
		{/if}
		<label for="amplitude">Amplitude:</label>
		<Slider id="amplitude" bind:value={amplitude} min={0} max={1} step={0.01} />
		<p>{(amplitude * 100).toPrecision(3)} %</p>
		<label for="duration">Duration:</label>
		<Slider id="duration" bind:value={duration} min={0.1} max={10} step={0.1} />
		<p>{duration.toPrecision(3)} s</p>
		{#if selected === SampleType.NOISE}
			<label for="falloff">Falloff:</label>
			<Slider id="falloff" bind:value={falloff} min={0} max={1} step={0.01} />
			<p>{falloff.toPrecision(3)}</p>
		{/if}
	</div>
</div>

<style lang="less">
	div.box {
		margin-top: 16px;
	}

	div.stack {
		display: grid;
		grid-template-columns: 14ch 1fr 8ch;
		align-items: center;
		gap: 6px;
	}

	p {
		text-align: right;
	}
</style>
