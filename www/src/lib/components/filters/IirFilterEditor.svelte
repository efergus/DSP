<script lang="ts">
	import { butterworth, single_pole_bandpass } from '$lib/audio/iir';
	import { AudioSample } from '$lib/audio/sample';
	import { filterRoots, IirDigital, type Root } from '$lib/dsp/iir';
	import type { Span2D } from '$lib/geometry/geometry';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import Waveform from '../audio/Waveform.svelte';

	const { data, span = $bindable() }: { data: AudioSample; span: Span2D } = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const sample_digital_filter = $derived(single_pole_bandpass(whatever, whatever2));
	let roots: Root[] = $state([]);
	let gain = $state(1);

	// roots = $derived(filterRoots(sample_digital_filter));
	$effect(() => {
		roots = filterRoots(sample_digital_filter);
		gain = sample_digital_filter.gain;
	});

	const digital_filter = $derived(IirDigital.from_roots(roots, gain));
	const applied = $derived(new AudioSample([digital_filter.apply(data)]));
	$inspect(span);
</script>

<PoleZeroEditor bind:roots conjugate />
<Waveform data={applied} {span} />
