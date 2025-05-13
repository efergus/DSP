<script lang="ts">
	import {
		complex,
		complex_dist,
		complex_polar,
		complex_to_polar,
		degrees_to_rad,
		rad_to_degrees,
		type Complex
	} from '$lib/dsp/complex';
	import { uniqueId } from '$lib/components/id';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import Circle from '$lib/icons/Circle.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import type { Root } from '$lib/dsp/iir';
	import LabeledSlider from '$lib/components/input/LabeledSlider.svelte';

	let {
		value = $bindable({
			degree: 1,
			val: complex(0, 0)
		}),
		polar = $bindable(false),
		hovered,
		ondelete,
		onenter,
		onleave,
		onfocus,
		onblur
	}: {
		value: Root;
		polar?: boolean;
		hovered?: boolean;
		selected?: boolean;
		ondelete?: () => void;
		onenter?: () => void;
		onleave?: () => void;
		onfocus?: () => void;
		onblur?: () => void;
	} = $props();

	let radius = $state(0);
	let angle = $state(0);

	let re = $state(0);
	let im = $state(0);

	const updateValueRect = (re2: number, im2: number) => {
		let val = complex(re2, im2);
		let polar = complex_to_polar(val);
		re = re2;
		im = im2;
		radius = polar.norm;
		angle = rad_to_degrees(polar.phase);
		value = {
			...value,
			val
		};
	};
	const updateValuePolar = (radius2: number, angle2: number) => {
		let val = complex_polar(degrees_to_rad(angle2), radius2);
		angle = angle2;
		radius = radius2;
		re = val.re;
		im = val.im;
		value = {
			...value,
			val
		};
	};
	const updateInput = (value: Complex) => {
		if (isNaN(value.re) || isNaN(value.im)) {
			return;
		}
		if (complex_dist(value, complex(re, im)) < 1e-9) {
			return;
		}
		let polar = complex_to_polar(value);
		radius = polar.norm;
		angle = rad_to_degrees(polar.phase);
		re = value.re;
		im = value.im;
	};
	$effect(() => updateInput(value.val));

	let states = [
		{
			stateName: 'Zero',
			circleFill: 'none',
			circleStroke: 'black',
			degree: 1
		},
		{
			stateName: 'Pole',
			circleFill: 'red',
			circleStroke: 'red',
			degree: -1
		}
	];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class={['container', hovered && 'hovered']}
	onmouseenter={() => onenter?.()}
	onmouseleave={() => onleave?.()}
	onfocusin={() => onfocus?.()}
	onfocusout={() => onblur?.()}
>
	<div class="header">
		{#if value.degree >= 0}
			Zero
			<div class="icon">
				<Circle size={12} />
				{value.degree}
			</div>
		{:else}
			Pole
			<div class="icon">
				<Circle size={12} stroke="red" fill="red" />
				{-value.degree}
			</div>
		{/if}
	</div>
	<div class="grid">
		{#if polar}
			<LabeledSlider
				label="radius:"
				value={radius}
				min={0}
				max={1}
				oninput={(value) => {
					updateValuePolar(value, angle);
				}}
			/>
			<LabeledSlider
				label="angle:"
				units="°"
				value={angle}
				min={0}
				max={180}
				oninput={(value) => {
					updateValuePolar(radius, value);
				}}
			/>
		{:else}
			<NumberInput
				value={re}
				oninput={({ value }) => {
					updateValueRect(value, im);
				}}
			>
				re:
			</NumberInput>
			<NumberInput
				value={im}
				oninput={({ value }) => {
					updateValueRect(re, value);
				}}
			>
				im:
			</NumberInput>
		{/if}
		<LabeledSlider
			label="degree:"
			value={value.degree}
			min={-10}
			max={10}
			step={1}
			precision={1}
			oninput={(degree) => {
				value = {
					...value,
					degree
				};
			}}
		/>
	</div>
</div>

<style lang="less">
	.container {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 4px;
		border: 1px solid transparent;
	}

	.container:not(:first-child) {
		border-top: 0px solid transparent;
	}
	.container:not(:last-child) {
		border-bottom: 1px solid black;
	}

	.grid {
		display: grid;
		grid-template-columns: 8ch 1fr 8ch 1ch;
		gap: 6px;
		align-items: center;
	}

	.hovered {
		border: 1px solid black;
	}

	.header {
		grid-column: span 4;
		display: flex;
		justify-content: space-between;
		gap: 2px;
		font-weight: bold;
	}

	.icon {
		display: flex;
		align-items: center;
		gap: 2px;
		font-size: 12px;
	}
</style>
