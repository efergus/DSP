<script lang="ts">
	import type { AudioSample } from '$lib/audio/sample';
	import { span2d } from '$lib/geometry/geometry';
	import Waveform from './Waveform.svelte';

	let {
		data
	}: {
		data: AudioSample;
	} = $props();

	let start = $derived(Math.max(0, data.duration() - 0.1));
</script>

<Waveform {data} span={span2d(start, start + 0.1, -0.1, 0.1)} />
