<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE } from '$lib/audio/sample';
	import { butterworth, IirContinuous, IirDigital, single_pole_bandpass } from '$lib/dsp/iir';
	import { FilterType } from './filter_creator';

	const {
		samplerate = $bindable(DEFAULT_AUDIO_SAMPLERATE),
		onFilterChange
	}: { samplerate?: number; onFilterChange?: (filter: IirContinuous) => void } = $props();
	let cutoff = $state(2000);
	let width = $state(10);
	let order = $state(4);
	let type = $state(FilterType.Butterworth);

	const createFilter = (cutoff: number, width: number, order: number) => {
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

	$effect(() => {
		const filter = createFilter(cutoff, width, order);
		if (filter) {
			onFilterChange?.(filter);
		}
	});
</script>

<div class="stack">
	<div>
		<label for="cutoff">Cutoff</label>
		<input type="range" bind:value={cutoff} min="10" max={samplerate / 2} step="1" id="cutoff" />
		<p>{cutoff}</p>
	</div>
	<div>
		<label for="width">Width</label>
		<input type="range" bind:value={width} min="1" max={samplerate / 2} step="1" id="width" />
		<p>{width}</p>
	</div>
	<div>
		<label for="order">Order</label>
		<input type="range" bind:value={order} min="1" max="10" step="1" id="order" />
		<p>{order}</p>
	</div>
	<div>
		<label for="type">Type</label>
		<select bind:value={type} id="type">
			<option value={FilterType.Pass}>Simple Pass</option>
			<option value={FilterType.Stop}>Simple Stop</option>
			<option value={FilterType.Butterworth}>Butterworth</option>
		</select>
	</div>
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: row;
		gap: 6px;
	}

	.stack {
		flex-direction: column;
	}
</style>
