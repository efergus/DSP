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

	let name = uniqueId('root-');

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
	class="outer"
	onmouseenter={() => onenter?.()}
	onmouseleave={() => onleave?.()}
	onfocusin={() => onfocus?.()}
	onfocusout={() => onblur?.()}
>
	<div class="state between">
		<div class={['state', hovered && 'gray']}>
			{#each states as state}
				<label class={[Math.sign(value.degree) === Math.sign(state.degree) && 'active']}>
					<Circle fill={state.circleFill} stroke={state.circleStroke} size={18} />
					<input
						type="radio"
						class="hidden"
						{name}
						onclick={() => {
							value = {
								...value,
								degree: state.degree
							};
						}}
					/>
				</label>
			{/each}
			{states[value.degree > 0 ? 0 : 1]?.stateName}
		</div>
		<button onclick={() => ondelete?.()}>
			<Trash />
		</button>
	</div>
	{#if polar}
		<NumberInput
			value={radius}
			oninput={({ value }) => {
				updateValuePolar(value, angle);
			}}
		>
			<i>r</i>:
		</NumberInput>
		<input
			type="range"
			min="0"
			max="6"
			step="0.1"
			value={-Math.log10(1 - radius)}
			oninput={(event) => {
				const val = event.currentTarget.valueAsNumber;
				updateValuePolar(1 - 10 ** -val, angle);
				// r = 1 - 10 ** -val
				// r - 1 = -10**-val
				// 1 - r = 10 ** -val
				// log10(1-r) = -val
			}}
		/>
		<!-- <RangeInput></RangeInput> -->
		<NumberInput
			horizontal={true}
			value={angle}
			oninput={({ value }) => {
				updateValuePolar(radius, value);
			}}
		>
			<i>θ</i>:
		</NumberInput>
		<input
			type="range"
			min="0"
			max="180"
			step="1"
			value={angle}
			oninput={(event) => {
				updateValuePolar(radius, event.currentTarget.valueAsNumber);
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
</div>

<style lang="less">
	.gray {
		background-color: gray;
	}

	label {
		display: flex;
		padding: 6px;
		border-radius: 6px;
		// height: fit-content;
	}

	label.active {
		background-color: gray;
	}

	.state {
		display: flex;
		align-items: center;
		flex-direction: row;
		gap: 0.5em;
	}

	.state.between {
		justify-content: space-between;
	}

	.outer {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.3em 0.5em 0.3em 0.5em;
		border-radius: 0.2em;
		background-color: white;
	}
</style>
