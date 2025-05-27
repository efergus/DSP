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
	import { filterRoots, root, type IirContinuous, type IirDigital } from '$lib/dsp/iir';
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
	import SampleSelector from './SampleOptions.svelte';
	import SampleTypeOptions from './SampleTypeOptions.svelte';
	import { SampleType } from '$lib/state/sample_selector';
	import ButtonGroup from '$lib/components/input/ButtonGroup.svelte';
	import { IirState } from '$lib/state/roots.svelte';
	import { complex } from '$lib/dsp/complex';
	import RootEditor from './RootEditor.svelte';

	const initialDuration = 2;
	const initialSample = squareSample(
		DEFAULT_AUDIO_SAMPLERATE / 100,
		DEFAULT_AUDIO_SAMPLERATE,
		DEFAULT_AUDIO_SAMPLERATE * initialDuration,
		0.5
	);
	let data: SampleData = $state(initialSample);
	let lastData: SampleData = $state(initialSample);
	let filteredData: SampleData = $state(initialSample);
	let debugData: SampleData = $state(initialSample);
	let frequencySpan = $state(span1d(0, 0.5));
	let filter: IirDigital | undefined = $state(undefined);
	let standardFilter: IirContinuous | undefined = $state(undefined);
	let sampleType: SampleType = $state(SampleType.SQUARE);
	let roots: IirState = new IirState([root(complex(0, 0), 1)]);
	let active = $state<number | null>(null);
	let hover = $state<number | null>(null);

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
			}
			lastDuration = duration;
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
		{roots}
		bind:span={getSpan, setSpan}
		bind:frequencySpan
		sampleFilter={standardFilter}
		onFilterChange={(value) => {
			filter = value;
			console.log(filter);
		}}
		onFilteredData={(sample) => (filteredData = sample)}
	>
		{#if filter}
			<FilterDetails {filter} samplerate={data.samplerate} />
		{/if}
	</IirFilterEditor>

	<div>
		<ButtonGroup>
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
					// playing = false;
					// console.log(data);
				}}
			/>

			<div />

			<SampleTypeOptions bind:value={sampleType} />
		</ButtonGroup>

		<SampleSelector
			{sampleType}
			onData={(sample) => {
				data = sample;
			}}
		/>
	</div>

	<div>
		<FilterCreator
			samplerate={data.samplerate}
			onFilterChange={(value) => {
				standardFilter = value;
				const digital = value.to_digital_bilinear();
				const dc_response = digital.frequency_response_norm(0);
				const nyquist_response = digital.frequency_response_norm(0.5);
				const greatest_response = Math.max(dc_response, nyquist_response);
				if (greatest_response > 1) {
					digital.gain /= greatest_response;
				}
				filter = digital;
			}}
		/>
	</div>
	<div></div>
	<div>
		{#each roots.zPlane as root, index}
			<RootEditor
				bind:value={() => root,
				(value) => {
					const newRoots = [...roots.zPlane];
					newRoots[index] = value;
					roots.setZPlane(newRoots);
					// const filter = computeDigitalFilter(roots);
					// onFilterChange?.(filter);
				}}
				hovered={hover === index}
				polar
				onenter={() => {
					hover = index;
				}}
				onleave={() => {
					hover = null;
				}}
				onfocus={() => {
					active = index;
				}}
				onblur={() => {
					active = null;
				}}
			/>
		{/each}
	</div>
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
</style>
