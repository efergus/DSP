<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { filterRoots, IirDigital, single_pole_bandpass, type OldRoot } from '$lib/dsp/iir';
	import type { Span2D } from '$lib/math/span';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import Waveform from '../audio/Waveform.svelte';
	import FilterDetails from './FilterDetails.svelte';
	import { throttle } from '$lib/input/debounce';
	import { onMount } from 'svelte';
	import { Player } from '$lib/audio/player';
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';

	let {
		data,
		span = $bindable(),
		onFilteredData
	}: {
		data: SampleData;
		span: Span2D;
		onFilteredData?: (sample: SampleData) => void;
	} = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const initialFilter = single_pole_bandpass(whatever, whatever2);
	const sample_digital_filter = $derived(initialFilter);
	let roots: OldRoot[] = $state([]);
	let previousInput: Sample | null = $state(null);
	let previousFilter: IirDigital | null = $state(null);
	let filteredData = $state(new SampleData());
	let filterChanged = $state(0);
	let player: PlayerWithFilter = $state(
		new PlayerWithFilter(undefined, {
			callback: ({ remaining }) => {
				if (!remaining) {
					const now = Date.now();
					if (now - filterChanged < 3000) {
						setTimeout(() => player.play(data), 250);
					}
				}
			}
		})
	);

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
	$effect(() => {
		player.setFilter(digital_filter);
		filterChanged = Date.now();
	});

	const updateFilteredData = (sample: SampleData, filter: IirDigital) => {
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
		onFilteredData?.(filteredData);
	};

	onMount(() => {
		let elapsed = 0;
		const doFilterUpdate = (dt: number) => {
			elapsed += dt;
			const quick = data === previousInput && digital_filter === previousFilter;
			if (quick || elapsed > 1000 / 10) {
				updateFilteredData(data, digital_filter);
				elapsed = 0;
			}
			requestAnimationFrame(doFilterUpdate);
		};
		requestAnimationFrame(doFilterUpdate);
	});
</script>

<div class="stack">
	<div style:height="250px">
		<p>Gain: {gain.toPrecision(3)}</p>
	</div>
	<div>
		<PoleZeroEditor bind:roots conjugate />
		<FilterDetails filter={digital_filter} />
	</div>
</div>

<style lang="less">
	div.stack {
		flex-direction: row;
		gap: 6px;
	}
</style>
