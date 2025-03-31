<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import Tape from '$lib/components/audio/Tape.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import { whiteNoiseSample } from '$lib/dsp/samples';
	import { clamp } from '$lib/math/clamp';
	import { isClose } from '$lib/math/float';
	import { point } from '$lib/math/point';
	import { Span2D, span2d } from '$lib/math/span';
	import { onMount } from 'svelte';

	const initialSample = whiteNoiseSample(DEFAULT_AUDIO_SAMPLERATE * 4);
	let data: SampleData = $state(initialSample);
	let filteredData: SampleData = $state(initialSample);

	let window = 0.8;
	let span = $state(span2d(0, window, -1, 1));
	const minDuration = 1 / DEFAULT_AUDIO_SAMPLERATE;
	let effectiveLimits = $state(span2d(0, window, -100, 100));
	onMount(() => {
		let lastDuration = 0;
		const updateSpan = () => {
			const duration = data.duration();
			if (duration !== lastDuration) {
				let window = span.x.size();
				// If we start a new sample with a large span, shrink it to fit better
				if (duration * 2 < window) {
					window = Math.max(1, duration * 2);
				}
				const start = Math.max(0, duration - window);
				span = span2d(start, start + window, -1, 1);
				effectiveLimits = span2d(0, Math.max(data.duration(), window, 1), -100, 100);
				lastDuration = duration;
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
</script>

<div>
	<Tape bind:span={getSpan, setSpan} {data} {filteredData} onData={(sample) => (data = sample)} />
	<IirFilterEditor
		{data}
		bind:span={getSpan, setSpan}
		onFilteredData={(sample) => (filteredData = sample)}
	/>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
	}
</style>
