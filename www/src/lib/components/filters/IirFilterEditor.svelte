<script lang="ts">
	import { butterworth, single_pole_bandpass } from '$lib/audio/iir';
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { filterRoots, IirDigital, type Root } from '$lib/dsp/iir';
	import type { Span2D } from '$lib/geometry/geometry';
	import { onMount } from 'svelte';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import Waveform from '../audio/Waveform.svelte';
	import FilterDetails from './FilterDetails.svelte';

	const { data, span = $bindable() }: { data: SampleData; span: Span2D } = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const initialFilter = single_pole_bandpass(whatever, whatever2);
	const sample_digital_filter = $derived(initialFilter);
	let roots: Root[] = $state([]);
	let previousInput: Sample | null = $state(null);
	let previousFilter: IirDigital | null = $state(null);
	let filteredData = $state(new SampleData());
	let gain = $state(1);

	const digital_filter = $derived(IirDigital.from_roots(roots, gain));

	// let roots = $derived(filterRoots(sample_digital_filter));
	$effect(() => {
		roots = filterRoots(sample_digital_filter);
		gain = sample_digital_filter.gain;
	});

	const updateFilteredData = (sample: SampleData, filter: IirDigital) => {
		let startIndex = 0;
		if (sample === previousInput) {
			startIndex = filteredData.length;
		} else {
			previousInput = sample;
			previousFilter = filter;
			filteredData = new SampleData();
		}
		filteredData.push(
			filter.apply(sample.slice(startIndex), sample.slice(0, startIndex), filteredData)
		);
	};

	onMount(() => {
		const doFilterUpdate = () => {
			updateFilteredData(data, digital_filter);
			requestAnimationFrame(doFilterUpdate);
		};
		requestAnimationFrame(doFilterUpdate);
	});
</script>

<PoleZeroEditor bind:roots conjugate />
<FilterDetails filter={digital_filter} />
<Waveform data={filteredData} {span} />
