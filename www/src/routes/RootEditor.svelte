<script lang="ts">
	import {
		complex,
		complex_dist,
		complex_norm2,
		complex_polar,
		complex_to_polar,
		degrees_to_rad,
		rad_to_degrees,
		type Complex
	} from '$lib/audio/complex';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import type { Root } from './PoleZeroEditor.svelte';

	let {
		value = $bindable({
			state: 0,
			val: complex(0, 0)
		}),
		polar = $bindable(false)
	}: {
		value: Root;
		polar?: boolean;
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
</script>

<div class="outer">
	{#if polar}
		<NumberInput
			value={radius}
			oninput={({ value }) => {
				updateValuePolar(value, angle);
			}}
		>
			r:
		</NumberInput>
		<NumberInput
			value={angle}
			oninput={({ value }) => {
				updateValuePolar(radius, value);
			}}
		>
			θ:
		</NumberInput>
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
	.outer {
		display: grid;
		grid-template-columns: 0.5fr 0.5fr;
		gap: 0.5em;
		padding: 0.3em 0.5em 0.3em 0.5em;
		border-radius: 0.2em;
		background-color: gray;
	}
</style>
