<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE } from '$lib/audio/sample';
	import {
		butterworth,
		butterworth_high_pass,
		IirContinuous,
		IirDigital,
		single_pole_bandpass
	} from '$lib/dsp/iir';
	import HighPass from '$lib/icons/HighPass.svelte';
	import LowPass from '$lib/icons/LowPass.svelte';
	import { type Snippet } from 'svelte';
	import Button from '../input/Button.svelte';
	import ButtonGroup from '../input/ButtonGroup.svelte';
	import Slider from '../input/Slider.svelte';
	import { FilterForm, FilterType } from './filter_creator';

	const {
		samplerate = $bindable(DEFAULT_AUDIO_SAMPLERATE),
		onFilterChange
	}: { samplerate?: number; onFilterChange?: (filter: IirContinuous) => void } = $props();
	let cutoff = $state(2000);
	let width = $state(10);
	let order = $state(4);
	let form = $state(FilterForm.Lowpass);
	let type = $state(FilterType.Butterworth);

	const options = [
		{ form: FilterForm.Lowpass, icon: LowPass },
		{ form: FilterForm.Highpass, icon: HighPass }
	];

	const computeFilter = (
		form: FilterForm,
		type: FilterType,
		cutoff: number,
		width: number,
		order: number
	) => {
		switch (type) {
			case FilterType.Pass:
				return single_pole_bandpass(cutoff / samplerate, width / samplerate);
			// case FilterType.Stop:
			// 	return single_pole_bandstop(cutoff / samplerate, width / samplerate, order);
			case FilterType.Butterworth:
				if (form == FilterForm.Lowpass) {
					return butterworth((cutoff / samplerate) * 2 * Math.PI, order);
				}
				return butterworth_high_pass((cutoff / samplerate) * 2 * Math.PI, order);
			// case FilterType.Chebyshev:
			// 	return chebyshev(cutoff, order);
			default:
				console.warn(`Unknown filter form: ${form}`);
				return null;
		}
	};

	const createFilter = (
		form: FilterForm,
		type: FilterType,
		cutoff: number,
		width: number,
		order: number
	) => {
		const filter = computeFilter(form, type, cutoff, width, order);
		if (!filter) {
			return;
		}
		onFilterChange?.(filter);
	};

	const initializeFilter = () => {
		createFilter(form, type, cutoff, width, order);
	};

	initializeFilter();
</script>

<ButtonGroup>
	{#each options as option}
		<Button
			onclick={() => {
				form = option.form;
				createFilter(form, type, cutoff, width, order);
			}}
			class={form === option.form ? 'selected' : ''}
		>
			<option.icon />
		</Button>
	{/each}
	<div></div>
</ButtonGroup>
<div class="box">
	<h3>{form}</h3>
	<div class="stack">
		<label for="type">Type</label>
		<select
			bind:value={type}
			id="type"
			oninput={(e) => {
				let val = (e.target as HTMLSelectElement).value;
				createFilter(form, val as FilterType, cutoff, width, order);
			}}
		>
			<option value={FilterType.Pass}>Simple Pass</option>
			<option value={FilterType.Stop}>Simple Stop</option>
			<option value={FilterType.Butterworth}>Butterworth</option>
		</select>
		<div />
		<label for="cutoff">Cutoff</label>
		<Slider
			bind:value={cutoff}
			min={200}
			max={samplerate / 2}
			step={1}
			id="cutoff"
			oninput={() => createFilter(form, type, cutoff, width, order)}
		/>
		<p>{cutoff} Hz</p>
		<label for="width">Width</label>
		<Slider
			bind:value={width}
			min={1}
			max={samplerate / 2}
			step={1}
			id="width"
			oninput={() => createFilter(form, type, cutoff, width, order)}
		/>
		<p>{width} Hz</p>
		<label for="order">Order</label>
		<Slider
			bind:value={order}
			min={1}
			max={10}
			step={1}
			id="order"
			oninput={() => createFilter(form, type, cutoff, width, order)}
		/>
		<p>{order}</p>
	</div>
</div>

<style lang="less">
	.stack {
		display: grid;
		grid-template-columns: 8ch 1fr 8ch;
		grid-auto-rows: minmax(2em, auto);
		align-items: center;
		gap: 6px;
		width: 100%;
	}

	p {
		text-align: right;
	}

	select {
		border: 1px solid black;
		border-radius: 0px;
		background-color: transparent;
	}

	.header {
		display: flex;
		gap: 6px;
	}

	.box {
		margin-top: 16px;
	}
</style>
