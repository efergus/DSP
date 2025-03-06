<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { filterRoots, IirDigital, single_pole_bandpass, type Root } from '$lib/dsp/iir';
	import type { Span2D } from '$lib/geometry/geometry';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import Waveform from '../audio/Waveform.svelte';
	import FilterDetails from './FilterDetails.svelte';
	import { throttle } from '$lib/input/debounce';
	import { onMount } from 'svelte';
	import { Player } from '$lib/audio/player';

	const { data, span = $bindable() }: { data: SampleData; span: Span2D } = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const initialFilter = single_pole_bandpass(whatever, whatever2);
	const sample_digital_filter = $derived(initialFilter);
	let roots: Root[] = $state([]);
	let previousInput: Sample | null = $state(null);
	let previousFilter: IirDigital | null = $state(null);
	let filteredData = $state(new SampleData());

	const digital_filter = $derived.by(() => {
		const baseFilter = IirDigital.from_roots(roots, 1);
		const peakResponseFreq = baseFilter.max_frequency_response();
		const peakResponse = baseFilter.frequency_response_norm(peakResponseFreq);
		baseFilter.gain = 1 / peakResponse;
		return baseFilter;
	});
	const gain = $derived(digital_filter.gain);

	// let roots = $derived(filterRoots(sample_digital_filter));
	$effect(() => {
		roots = filterRoots(sample_digital_filter);
	});

	const updateFilteredData = (sample: SampleData, filter: IirDigital) => {
		// console.log('update');
		let startIndex = 0;
		if (sample === previousInput && filter === previousFilter) {
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
		let elapsed = 0;
		const doFilterUpdate = (dt: number) => {
			elapsed += dt;
			const quick = data === previousInput && digital_filter === previousFilter;
			if (quick || elapsed > 1000 / 10) {
				updateFilteredData(data, digital_filter);
				requestAnimationFrame(doFilterUpdate);
				elapsed = 0;
			}
		};
		requestAnimationFrame(doFilterUpdate);
	});
</script>

<div class="vrt">
	<p>Gain: {gain.toPrecision(3)}</p>
	<div>
		<PoleZeroEditor bind:roots conjugate />
		<FilterDetails filter={digital_filter} />
	</div>
</div>
<div class="vrt">
	<button
		onclick={() => {
			const player = new Player();
			player.play(filteredData);
		}}
	>
		Play
	</button>
	<Waveform data={filteredData} {span} />
</div>

<style lang="less">
	div {
		display: flex;
		gap: 6px;
	}
	div.vrt {
		flex-direction: column;
		align-items: start;
	}
</style>
