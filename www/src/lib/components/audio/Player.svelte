<script lang="ts">
	import type { AudioSample } from '$lib/audio/sample';
	import { type Span2D } from '$lib/geometry/geometry';
	import type { MouseStateHandler } from '$lib/input/state';
	import Waveform from './Waveform.svelte';

	let {
		data,
		span,
		onmouse
	}: {
		data: AudioSample;
		span: Span2D;
		onmouse?: MouseStateHandler;
	} = $props();
</script>

<Waveform {data} {span} {onmouse} />
