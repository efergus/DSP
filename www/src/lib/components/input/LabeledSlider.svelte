<script lang="ts">
	import { sigFigs } from '$lib/math/float';
	import { uniqueId } from '../id';
	import Slider from './Slider.svelte';
	import { type SliderAttributes } from './Slider.svelte';

	const id = uniqueId();

	let sliderValue = $state(0);
	let textValue = $state('0');
	let tempValue = $state(0);
	let trueValue = $state(0);

	let {
		label,
		units,
		precision = 2,
		log = false,
		min = 0,
		max = 1,
		step,
		value = $bindable(0),
		oninput,
		onchange,
		...rest
	}: {
		label: string;
		units?: string;
		precision?: number;
		log?: boolean;
	} & SliderAttributes = $props();

	const sliderMin = $derived(log ? Math.log(min) : min);
	const sliderMax = $derived(log ? Math.log(max) : max);

	const parseValue = (rawValue: string) => {
		const value = Number(rawValue);
		if (isNaN(value)) {
			return tempValue;
		}
		return value;
	};

	const cleanValue = (rawValue: number) => {
		if (isNaN(rawValue)) {
			return value;
		}
		if (step && step - Math.floor(step) === 0) {
			rawValue = Math.round(rawValue / step) * step;
		}
		rawValue = Math.max(min, Math.min(max, rawValue));
		return parseFloat(sigFigs(rawValue, precision));
	};

	const getSliderValue = (value: number) => {
		if (isNaN(value)) {
			return 0;
		}
		if (log) {
			return Math.log(value);
		}
		return value;
	};

	const updateFromExternalChange = (value: number) => {
		if (value !== trueValue && !isNaN(value)) {
			tempValue = value;
			trueValue = value;
			textValue = cleanValue(value).toString();
			sliderValue = getSliderValue(value);
		}
	};

	$effect(() => {
		updateFromExternalChange(value);
	});

	const sliderInput = (newValue: number) => {
		if (log) {
			newValue = Math.exp(newValue);
		}
		const safeValue = cleanValue(newValue);
		tempValue = safeValue;
		value = safeValue;
		trueValue = safeValue;
		textValue = sigFigs(safeValue, precision);
	};
</script>

<label for={id}>{label}</label>
<Slider
	{id}
	bind:value={sliderValue}
	min={sliderMin}
	max={sliderMax}
	{step}
	{...rest}
	oninput={(value) => {
		sliderInput(value);
		oninput?.(value);
	}}
	onchange={(value) => {
		sliderInput(value);
		onchange?.(value);
	}}
/>
<input
	type="text"
	bind:value={textValue}
	oninput={(e) => {
		const newValue = parseValue((e.target as HTMLInputElement).value);
		tempValue = newValue;
		sliderValue = getSliderValue(newValue);
		const safeValue = cleanValue(newValue);
		if (safeValue === tempValue) {
			trueValue = safeValue;
			value = safeValue;
		}
		oninput?.(safeValue);
	}}
	onchange={(e) => {
		const newValue = parseValue((e.target as HTMLInputElement).value);
		const safeValue = cleanValue(newValue);
		tempValue = safeValue;
		sliderValue = getSliderValue(newValue);
		value = safeValue;
		trueValue = safeValue;
		textValue = sigFigs(safeValue, precision);
		onchange?.(safeValue);
	}}
/>
<span>{units ? ' ' : ''}{units}</span>

<style lang="less">
	label,
	span,
	input {
		font-size: 14px;
	}

	input {
		width: 8ch;
		text-align: right;
		line-height: 1;
		padding: 3px 2px 1px 0px;
		justify-self: end;
	}

	span {
		padding-top: 4px;
	}
</style>
