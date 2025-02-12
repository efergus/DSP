<script lang="ts">
	import type { IirDigital } from '$lib/audio/iir';
	import { phaseNoise, whiteNoise } from '$lib/audio/signals';
	import Spectrum from './Spectrum.svelte';
	import Waveform from './Waveform.svelte';

	const {
		filter
	}: {
		filter: IirDigital;
	} = $props();

	const size = 128;
	// const noiseSample = whiteNoise(size);
	const noiseSample = phaseNoise(size);
	const filteredSample = $derived(filter.apply(noiseSample));
	$inspect({ filteredSample });
</script>

<Waveform data={noiseSample} />
<Waveform data={filteredSample} />
<Spectrum data={noiseSample} {size} scale={0.01} />
<Spectrum data={filteredSample} {size} scale={0.01} />
