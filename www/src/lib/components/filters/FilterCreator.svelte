<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE } from '$lib/audio/sample';
	import { butterworth, IirContinuous, IirDigital, single_pole_bandpass } from '$lib/dsp/iir';
	import Slider from '../input/Slider.svelte';
	import { FilterType } from './filter_creator';

	const {
		samplerate = $bindable(DEFAULT_AUDIO_SAMPLERATE),
		onFilterChange
	}: { samplerate?: number; onFilterChange?: (filter: IirContinuous) => void } = $props();
	let cutoff = $state(2000);
	let width = $state(10);
	let order = $state(4);
	let type = $state(FilterType.Butterworth);

	const computeFilter = (type: FilterType, cutoff: number, width: number, order: number) => {
		console.log(type, cutoff, width, order);
		switch (type) {
			case FilterType.Pass:
				return single_pole_bandpass(cutoff / samplerate, width / samplerate);
			// case FilterType.Stop:
			// 	return single_pole_bandstop(cutoff / samplerate, width / samplerate, order);
			case FilterType.Butterworth:
				return butterworth((cutoff / samplerate) * 2 * Math.PI, order);
			// case FilterType.Chebyshev:
			// 	return chebyshev(cutoff, order);
			default:
				console.warn(`Unknown filter type: ${type}`);
				return null;
		}
	};

	const createFilter = (type: FilterType, cutoff: number, width: number, order: number) => {
		const filter = computeFilter(type, cutoff, width, order);
		if (!filter) {
			return;
		}
		onFilterChange?.(filter);
	};

	const initializeFilter = () => {
		createFilter(type, cutoff, width, order);
	};

	initializeFilter();
</script>

<div>
	<label for="cutoff">Cutoff</label>
	<Slider
		bind:value={cutoff}
		min={200}
		max={samplerate / 2}
		step={1}
		id="cutoff"
		oninput={() => createFilter(type, cutoff, width, order)}
	/>
	<p>{cutoff} Hz</p>
	<label for="width">Width</label>
	<Slider
		bind:value={width}
		min={1}
		max={samplerate / 2}
		step={1}
		id="width"
		oninput={() => createFilter(type, cutoff, width, order)}
	/>
	<p>{width} Hz</p>
	<label for="order">Order</label>
	<Slider
		bind:value={order}
		min={1}
		max={10}
		step={1}
		id="order"
		oninput={() => createFilter(type, cutoff, width, order)}
	/>
	<p>{order}</p>
	<label for="type">Type</label>
	<select
		bind:value={type}
		id="type"
		oninput={(e) => {
			let val = (e.target as HTMLSelectElement).value;
			createFilter(val as FilterType, cutoff, width, order);
		}}
	>
		<option value={FilterType.Pass}>Simple Pass</option>
		<option value={FilterType.Stop}>Simple Stop</option>
		<option value={FilterType.Butterworth}>Butterworth</option>
	</select>
</div>

<style lang="less">
	div {
		display: grid;
		grid-template-columns: 8ch 1fr 8ch;
		align-items: center;
		gap: 6px;
		width: 100%;
	}

	p {
		text-align: right;
	}
</style>
