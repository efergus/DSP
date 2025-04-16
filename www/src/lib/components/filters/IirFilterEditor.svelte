<script lang="ts">
	import { SampleData, type Sample } from '$lib/audio/sample';
	import { filterRoots, IirDigital, single_pole_bandpass, type Root } from '$lib/dsp/iir';
	import { span2d, type Span1D, type Span2D } from '$lib/math/span';
	import PoleZeroEditor from '../../../routes/PoleZeroEditor.svelte';
	import FilterDetails from './FilterDetails.svelte';
	import { onMount, type Snippet } from 'svelte';
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import { IirRootsState } from '$lib/state/roots.svelte';

	let {
		data,
		span = $bindable(),
		frequencySpan = $bindable(),
		sampleFilter,
		onFilterChange,
		onFilteredData,
		children
	}: {
		data: SampleData;
		span: Span2D;
		frequencySpan: Span1D;
		sampleFilter?: IirDigital;
		onFilterChange?: (filter: IirDigital) => void;
		onFilteredData?: (sample: SampleData) => void;
		children?: Snippet;
	} = $props();

	const whatever = 0.1;
	const whatever2 = 0.1;
	const initialFilter = single_pole_bandpass(whatever, whatever2);
	let roots: IirRootsState = new IirRootsState(filterRoots(initialFilter));

	let previousInput: Sample | null = $state(null);
	let previousFilter: IirDigital | null = $state(null);
	let previousSampleFilter: IirDigital | null = $state(null);
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
		const baseFilter = IirDigital.from_roots(roots.zPlane, 1);
		const peakResponseFreq = baseFilter.max_frequency_response();
		const peakResponse = baseFilter.frequency_response_norm(peakResponseFreq);
		baseFilter.gain = 1 / peakResponse;
		return baseFilter;
	});
	const gain = $derived(digital_filter.gain);

	$effect(() => {
		onFilterChange?.(digital_filter);
		player.setFilter(digital_filter);
		filterChanged = Date.now();
	});

	const updateRoots = (controlledFilter: IirDigital) => {
		const newRoots = filterRoots(controlledFilter);
		roots.setZPlane(newRoots);
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

	$inspect(roots);
</script>

<div class="stack">
	<div style:height="250px">
		<p>Gain: {gain.toPrecision(3)}</p>
		{@render children?.()}
	</div>
	<div class="shelf">
		<PoleZeroEditor
			bind:roots={() => roots.sPlane, (value) => roots.setSPlane(value)}
			span={span2d(-1, 0.1, frequencySpan.start * 2 * Math.PI, frequencySpan.end * 2 * Math.PI)}
		/>
		<PoleZeroEditor
			bind:roots={() => roots.zPlane, (value) => roots.setZPlane(value)}
			zPlane={true}
			span={span2d(-1.2, 1.2, -1.2, 1.2)}
		/>
	</div>
	<FilterDetails filter={digital_filter} />
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
