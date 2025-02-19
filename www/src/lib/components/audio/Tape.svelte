<script lang="ts">
	import { AudioSample } from '$lib/audio/sample';
	import { span2d, type Span2D } from '$lib/geometry/geometry';
	import Player from './Player.svelte';
	import Recorder from './Recorder.svelte';

	let {
		span,
		onData
	}: {
		span: Span2D;
		onData?: (sample: AudioSample) => void;
	} = $props();

	let data = $state(new AudioSample());

	// $inspect(data);
</script>

<div>
	<Recorder
		onChunk={(chunk) => {
			if (chunk.index === 0) {
				data = new AudioSample();
				length = 0;
			}
			data = data.shallowCopy();
			data.push(chunk.data);
			onData?.(data);
		}}
	/>
	<Player {data} {span} />
</div>

<style lang="less">
	div {
		margin: 2px;
	}
</style>
