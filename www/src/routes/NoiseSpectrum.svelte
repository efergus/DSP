<script lang="ts">
	import Spectrum from './Spectrum.svelte';
	import Waveform from './OldWaveform.svelte';
	import { phaseNoise } from '$lib/dsp/samples';
	import type { IirDigital } from '$lib/dsp/iir';

	const {
		filter
	}: {
		filter: IirDigital;
	} = $props();

	const size = 128;
	// const noiseSample = whiteNoise(size);
	const noiseSample = phaseNoise(size);
	const filteredSample = $derived(filter.apply(noiseSample));
	// $inspect({ filteredSample });
</script>

<Waveform data={noiseSample} />
<Waveform data={filteredSample} />
<Spectrum data={noiseSample} {size} scale={0.01} />
<Spectrum data={filteredSample} {size} scale={0.01} />
