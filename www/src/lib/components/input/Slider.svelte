<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface SliderAttributes extends Omit<HTMLInputAttributes, 'value' | 'oninput' | 'onchange'> {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		oninput?: (value: number) => void;
		onchange?: (value: number) => void;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 1,
		step = 0.01,
		oninput,
		onchange,
		...rest
	}: SliderAttributes = $props();

	const handleUpdate = (handler?: (value: number) => void) => (e: Event) => {
		let val = (e.target as HTMLInputElement).valueAsNumber;
		if (isNaN(val)) {
			return;
		}
		handler?.(val);
	};
</script>

<input
	type="range"
	class="slider"
	{...rest}
	bind:value
	{min}
	{max}
	{step}
	onchange={handleUpdate(onchange)}
	oninput={handleUpdate(oninput)}
/>

<style lang="less">
	.slider {
		-webkit-appearance: none; /* Override default CSS styles */
		appearance: none;
		width: 100%; /* Full-width */
		height: 4px; /* Specified height */
		background: #808080; /* Grey background */
		outline: none; /* Remove outline */
		opacity: 1; /* Set transparency (for mouse-over effects on hover) */
		border-radius: 0px; /* Remove rounded corners */
		padding: 0px; /* Remove padding */

		&:hover {
			background-color: #a0a0a0;
		}
	}

	/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none; /* Override default look */
		appearance: none;
		width: 8px; /* Set a specific slider handle width */
		height: 24px; /* Slider handle height */
		background: #000000; /* Green background */
		cursor: pointer; /* Cursor on hover */
	}

	.slider::-moz-range-thumb {
		width: 25px; /* Set a specific slider handle width */
		height: 25px; /* Slider handle height */
		background: #000000; /* Green background */
		cursor: pointer; /* Cursor on hover */
	}
</style>
