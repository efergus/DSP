<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import Tape from '$lib/components/audio/Tape.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import { whiteNoiseSample } from '$lib/dsp/samples';
	import { span2d } from '$lib/math/span';
	import { onMount } from 'svelte';

	const initialSample = whiteNoiseSample(DEFAULT_AUDIO_SAMPLERATE * 4);
	let data: SampleData = $state(initialSample);

	let window = 0.8;
	let span = $state(span2d(0, window, -1, 1));

	onMount(() => {
		let lastDuration = 0;
		const updateSpan = () => {
			const duration = data.duration();
			if (duration !== lastDuration) {
				const start = Math.max(0, duration - window);
				span = span2d(start, start + window, -1, 1);
				lastDuration = duration;
			}
			requestAnimationFrame(updateSpan);
		};
		requestAnimationFrame(updateSpan);
	});
</script>

<div>
	<Tape bind:span {data} onData={(sample) => (data = sample)} />
	<IirFilterEditor {data} bind:span />
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
	}
</style>
