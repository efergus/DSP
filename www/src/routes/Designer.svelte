<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import AudioFileInput from '$lib/components/audio/AudioFileInput.svelte';
	import AudioPlayButton from '$lib/components/audio/AudioPlayButton.svelte';
	import Recorder from '$lib/components/audio/Recorder.svelte';
	import Tape from '$lib/components/audio/Tape.svelte';
	import Waveform from '$lib/components/audio/Waveform.svelte';
	import FilterCreator from '$lib/components/filters/FilterCreator.svelte';
	import FilterDetails from '$lib/components/filters/FilterDetails.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import Button from '$lib/components/input/Button.svelte';
	import type { IirContinuous, IirDigital } from '$lib/dsp/iir';
	import {
		chirpSample,
		phaseNoiseSample,
		pinkNoiseSample,
		squareSample,
		whiteNoiseSample
	} from '$lib/dsp/samples';
	import { clamp } from '$lib/math/clamp';
	import { isClose } from '$lib/math/float';
	import { point } from '$lib/math/point';
	import { span1d, Span2D, span2d, span2dFromSpans } from '$lib/math/span';
	import { onMount } from 'svelte';

	const initialDuration = 2;
	const initialSample = squareSample(
		DEFAULT_AUDIO_SAMPLERATE / 100,
		DEFAULT_AUDIO_SAMPLERATE,
		DEFAULT_AUDIO_SAMPLERATE * initialDuration,
		0.75
	);
	let data: SampleData = $state(initialSample);
	let lastData: SampleData = $state(initialSample);
	let filteredData: SampleData = $state(initialSample);
	let debugData: SampleData = $state(initialSample);
	let frequencySpan = $state(span1d(0, 0.5));
	let filter: IirDigital | undefined = $state(undefined);
	let standardFilter: IirContinuous | undefined = $state(undefined);

	const window = 256 / DEFAULT_AUDIO_SAMPLERATE;
	let span = $state(span2d(0, window, -1, 1));
	const minDuration = 1 / DEFAULT_AUDIO_SAMPLERATE;
	let effectiveLimits = $state(span2d(0, initialDuration, -100, 100));

	const playUpdateSpan = (data: SampleData) => {
		const duration = data.duration();
		const window = Math.max(span.x.size(), 1);
		const start = Math.max(0, duration - window);
		span = span2d(start, start + window, -1, 1);
		effectiveLimits = span2d(0, duration, -100, 100);
	};

	onMount(() => {
		let lastDuration = data.duration();
		const updateSpan = () => {
			const duration = data.duration();
			// console.log(duration, lastDuration);
			if (data !== lastData) {
				lastData = data;
				span = span2d(0, Math.max(Math.min(span.x.size(), data.duration()), window), -1, 1);
				effectiveLimits = span2d(0, Math.max(data.duration(), span.x.end), -100, 100);
			} else if (duration > lastDuration) {
				const window = Math.max(Math.min(span.x.size(), duration), 1);
				const start = Math.max(0, duration - window);
				span = span2d(start, start + window, -1, 1);
				effectiveLimits = span2d(0, Math.max(duration, window), -100, 100);
				lastDuration = duration;
				// console.log(span);
			}
			requestAnimationFrame(updateSpan);
		};
		requestAnimationFrame(updateSpan);
	});

	let effectiveMinDuration = $derived(minDuration ?? 1 / data.samplerate);

	const getSpan = () => span;
	const setSpan = (newSpan: Span2D) => {
		const size = span.size();
		if (newSpan.x.size() < effectiveMinDuration) {
			const center = span.x.center();
			span = span2d(
				center - effectiveMinDuration / 2,
				center + effectiveMinDuration / 2,
				span.y.start,
				span.y.end
			);
			return;
		}

		if (
			size.x > 1e-6 &&
			isClose(size.x, newSpan.x.size(), 1e-9) &&
			isClose(size.y, newSpan.y.size(), 1e-9)
		) {
			const start = point(
				clamp(newSpan.x.start, effectiveLimits.x.start, effectiveLimits.x.end - size.x),
				clamp(newSpan.y.start, effectiveLimits.y.start, effectiveLimits.y.end - size.y)
			);
			span = span2d(start.x, start.x + size.x, start.y, start.y + size.y);
		} else {
			span = newSpan.intersect(effectiveLimits);
		}
	};

	let cursor: number | null = $state(null);
	let playing = $state(false);
</script>

<div class="grid">
	<h2>Sample</h2>
	<h2>Filter</h2>
	<Tape
		bind:span={getSpan, setSpan}
		bind:frequencySpan
		{data}
		{filteredData}
		{filter}
		{cursor}
		{playing}
	/>
	<IirFilterEditor
		{data}
		bind:span={getSpan, setSpan}
		bind:frequencySpan
		sampleFilter={standardFilter}
		onFilterChange={(value) => (filter = value)}
		onFilteredData={(sample) => (filteredData = sample)}
	>
		{#if filter}
			<FilterDetails {filter} />
		{/if}
	</IirFilterEditor>

	<div>
		<div class="buttons">
			<AudioPlayButton
				{data}
				{filter}
				onFrame={(frame, player) => {
					cursor = frame / data.samplerate;
					if (span.x.end < cursor) {
						span = span2dFromSpans(span.x.move(cursor - span.x.end), span.y);
					}
					if (span.x.start > cursor) {
						span = span2dFromSpans(span.x.move(cursor - span.x.start), span.y);
					}
					if (frame > DEFAULT_AUDIO_SAMPLERATE) {
						debugData = new SampleData(player.debugData());
					}
				}}
				bind:playing
			/>
			<AudioFileInput
				onData={(sample) => {
					data = sample;
					const sampleSpan = sample.span();
					const vertical = Math.max(Math.abs(sampleSpan.y.min), Math.abs(sampleSpan.y.max));
					span = span2dFromSpans(sampleSpan.x, span1d(-vertical, vertical));
				}}
			/>

			<Recorder
				onData={(sample) => {
					data = sample;
					playUpdateSpan(data);
					// console.log(data);
				}}
			/>

			<Button
				onclick={() => {
					data = chirpSample(20, 4000);
				}}
				>Chirp
			</Button>
			<Button
				onclick={() => {
					data = whiteNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				}}
				>Noise
			</Button>
			<Button
				onclick={() => {
					data = pinkNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				}}
				>Pink noise
			</Button>
			<Button
				onclick={() => {
					data = phaseNoiseSample(4 * DEFAULT_AUDIO_SAMPLERATE);
				}}
				>Random phase
			</Button>
		</div>
	</div>
	<Waveform data={debugData} {span} />
	<FilterCreator
		samplerate={data.samplerate}
		onFilterChange={(value) => {
			standardFilter = value;
			const digital = value.to_digital_bilinear();
			const response = digital.frequency_response_norm(0);
			if (response > 1) {
				digital.gain /= response;
			}
			filter = digital;
		}}
	/>
</div>

<style>
	h2 {
		border-bottom: 1px solid black;
	}

	div.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 6px;
	}

	.buttons {
		display: flex;
		justify-content: stretch;
		border: 1px solid black;

		> :global(*) {
			border: none;
		}
		> :global(:not(:last-child)) {
			border-right: 1px solid silver;
		}
	}
</style>
