<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import Tape from '$lib/components/audio/Tape.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import { span2d } from '$lib/math/geometry';
	import { onMount } from 'svelte';

	const initialSample = new Float32Array(44100);
	initialSample[0] = 1.0;
	let data: SampleData = $state(new SampleData(initialSample));

	let window = 0.8;
	let span = $state(span2d(0, window, -0.2, 0.2));

	onMount(() => {
		let lastDuration = 0;
		const updateSpan = () => {
			const duration = data.duration();
			if (duration !== lastDuration) {
				const start = Math.max(0, duration - window);
				span = span2d(start, start + window, -0.2, 0.2);
				lastDuration = duration;
			}
			requestAnimationFrame(updateSpan);
		};
		requestAnimationFrame(updateSpan);
	});
</script>

<div>
	<Tape bind:span onData={(sample) => (data = sample)} />
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
