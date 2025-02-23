<script lang="ts">
	import { AudioSample } from '$lib/audio/sample';
	import { type Span2D } from '$lib/geometry/geometry';
	import Player from './Player.svelte';
	import Recorder from './Recorder.svelte';

	let {
		span = $bindable(),
		onData,
		onMouse
	}: {
		span: Span2D;
		onData?: (sample: AudioSample) => void;
		onMouse?: () => void;
	} = $props();

	let data = $state(new AudioSample());
</script>

<div>
	<Player {data} bind:span />
	<Recorder
		onData={(newData) => {
			data = newData;
			onData?.(data);
		}}
	/>
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 2px;
	}
</style>
