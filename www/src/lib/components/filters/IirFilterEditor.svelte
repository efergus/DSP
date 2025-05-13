<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import {
		filterRoots,
		IirContinuous,
		IirDigital,
		single_pole_bandpass,
		type Root
	} from '$lib/dsp/iir';
	import { span2d, type Span1D, type Span2D } from '$lib/math/span';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import FilterDetails from './FilterDetails.svelte';
	import { onMount, type Snippet } from 'svelte';
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import { IirState } from '$lib/state/roots.svelte';
	import RootEditor from '../../../routes/RootEditor.svelte';
	import FilterCreator from './FilterCreator.svelte';

	let {
		data,
		roots,
		span = $bindable(),
		frequencySpan = $bindable(),
		sampleFilter = $bindable(),
		onFilterChange,
		onFilteredData,
		children
	}: {
		data: SampleData;
		roots: IirState;
		span: Span2D;
		frequencySpan: Span1D;
		sampleFilter?: IirContinuous;

		onFilterChange?: (filter: IirDigital) => void;
		onFilteredData?: (sample: SampleData) => void;
		children?: Snippet;
	} = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const initialFilter = single_pole_bandpass(whatever, whatever2);

	let previousInput: Sample | null = $state(null);
	let previousFilter: IirDigital | null = $state(null);
	let previousSampleFilter: IirContinuous | null = $state(null);
	let filteredData = $state(new SampleData());

	let hover = $state<number | null>(null);
	let active = $state<number | null>(null);

	const computeDigitalFilter = (roots: IirState) => {
		const baseFilter = IirDigital.from_roots(roots.zPlane, 1);
		const peakResponseFreq = baseFilter.max_frequency_response();
		const peakResponse = baseFilter.frequency_response_norm(peakResponseFreq);
		baseFilter.gain = 1 / peakResponse;
		return baseFilter;
	};

	const digital_filter = $derived(computeDigitalFilter(roots));

	const updateRoots = (controlledFilter: IirContinuous) => {
		roots.setContinuous(controlledFilter);
	};

	$effect(() => {
		if (sampleFilter && sampleFilter !== previousSampleFilter) {
			updateRoots(sampleFilter);
			previousSampleFilter = sampleFilter;
		}
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
		if (startIndex >= sample.length) {
			return;
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
		{@render children?.()}
	</div>
	<div class="shelf">
		<PoleZeroEditor
			bind:roots={() => roots.sPlane,
			(value) => {
				roots.setSPlane(value);
				const filter = computeDigitalFilter(roots);
				roots.setDigital(filter);
				onFilterChange?.(filter);
			}}
			bind:hover
			bind:active
			span={span2d(-frequencySpan.size(), 0.1, frequencySpan.start, frequencySpan.end)}
		/>
		<PoleZeroEditor
			bind:roots={() => roots.zPlane,
			(value) => {
				roots.setZPlane(value);
				const filter = computeDigitalFilter(roots);
				roots.setDigital(filter);
				onFilterChange?.(filter);
			}}
			zPlane={true}
			bind:hover
			bind:active
			span={span2d(-1.2, 1.2, -1.2, 1.2)}
		/>
	</div>
</div>

<style lang="less">
	div.stack {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.shelf {
		display: flex;
		gap: 6px;
	}
</style>
