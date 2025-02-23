<script lang="ts">
	import { AudioSample } from '$lib/audio/sample';
	import Tape from '$lib/components/audio/Tape.svelte';
	import FilterExplorer from '$lib/components/filters/FilterExplorer.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import { span2d } from '$lib/geometry/geometry';

	const initialSample = new Float32Array(44100);
	initialSample[0] = 1.0;
	let data: AudioSample = $state(new AudioSample(initialSample));
	// $inspect(data);

	let window = 0.8;
	let start = $derived(Math.max(0, data.duration() - window));
	let span = $state(span2d(0, window, -0.2, 0.2));
	$effect(() => {
		span = span2d(start, start + window, -0.2, 0.2);
	});
	// $inspect(start);
</script>

<div>
	<Tape bind:span onData={(sample) => (data = sample)} />
	<IirFilterEditor {data} bind:span />
	<FilterExplorer />
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
	}
</style>
