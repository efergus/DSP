<script lang="ts">
	import { Recorder as AudioRecorder } from '$lib/audio/recorder';
	import { SampleData, SampleSlice } from '$lib/audio/sample';
	import Circle from '$lib/icons/Circle.svelte';
	import Square from '$lib/icons/Square.svelte';
	import Upload from '$lib/icons/Upload.svelte';
	import { uniqueId } from '../id';

	const {
		onData,
		rateLimit = 30
	}: {
		onData?: (data: SampleData) => void;
		rateLimit?: number;
	} = $props();

	let recording = $state(false);
	const recorder = new AudioRecorder();

	let lastUpdate = 0;
	const limitedUpdate = (data: SampleData) => {
		const now = Date.now();
		if (now - lastUpdate > 1000 / rateLimit) {
			onData?.(data);
			lastUpdate = now;
		}
	};
</script>

<button
	onclick={() => {
		if (recording) {
			recorder.stop();
			onData?.(recorder.getSample());
		} else {
			recorder.start({
				callback: ({ sample }) => limitedUpdate(sample)
			});
		}
		recording = !recording;
	}}
>
	{#if recording}
		<Square fill="black" />
	{:else}
		<Circle stroke="red" fill="red" />
	{/if}
</button>
