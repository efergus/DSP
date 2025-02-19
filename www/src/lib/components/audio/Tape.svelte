<script>
	import { AudioSample } from '$lib/audio/sample';
	import { span2d } from '$lib/geometry/geometry';
	import Player from './Player.svelte';
	import Recorder from './Recorder.svelte';

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
			data.push(chunk.data);
			data = data.copy();
		}}
	/>
	<Player {data} />
</div>

<style lang="less">
	div {
		margin: 2px;
	}
</style>
