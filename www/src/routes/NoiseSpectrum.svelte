<script lang="ts">
	import type { IirDigital } from '$lib/audio/iir';
	import { whiteNoise } from '$lib/audio/signals';
	import Spectrum from './Spectrum.svelte';
	import Waveform from './Waveform.svelte';

	const {
		filter
	}: {
		filter: IirDigital;
	} = $props();

	const whiteNoiseSample = whiteNoise(1024);
	const filteredSample = $derived(filter.apply(whiteNoiseSample));
	$inspect({ filteredSample });
</script>

<Waveform data={whiteNoiseSample} scale={0.5} />
<Waveform data={filteredSample} scale={0.5} />
<Spectrum data={whiteNoiseSample} scale={0.01} />
<Spectrum data={filteredSample} scale={0.01} />
