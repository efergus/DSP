<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { uniqueId } from './id';
	import type { Handler } from '$lib/input/functions';

	export type NumberInputChangeEvent = {
		value: number;
		event: Event;
	};

	let {
		children,
		value = $bindable(0),
		onchange,
		oninput,
		...rest
	}: {
		value: number;
		onchange?: Handler<NumberInputChangeEvent>;
		oninput?: Handler<NumberInputChangeEvent>;
	} & Omit<HTMLInputAttributes, 'value' | 'onchange' | 'oninput'> = $props();

	let id = uniqueId();

	let currentNumberValue = $state(value);
	let currentStringValue = $state(value.toFixed(6));

	const valueChanged = (value: number) => {
		currentNumberValue = value;
		currentStringValue = value.toFixed(6);
	};
	const inputChanged = (currentValue: string) => {
		let val = Number(currentValue);
		if (!isNaN(val) && val !== value) {
			value = val;
			currentNumberValue = val;
		}
		return value;
	};
	$effect(() => {
		if (value !== currentNumberValue) {
			valueChanged(value);
		}
	});
</script>

<div>
	<label for={id}>{@render children?.()}</label>
	<input
		{id}
		type="text"
		{...rest}
		value={currentStringValue}
		onchange={(event) => {
			let valueString = event.currentTarget.value;
			let value = inputChanged(valueString);
			valueChanged(value);
			onchange?.({
				value,
				event
			});
		}}
		oninput={(event) => {
			let valueString = event.currentTarget.value;
			value = inputChanged(valueString);
			oninput?.({
				value,
				event
			});
		}}
	/>
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 0.2em;
	}

	input {
		border-radius: 0.5em;
		// border-color: blue;
		border-style: none;
		// max-width: 5ch;
		flex-shrink: 1;
		max-width: 12ch;
		text-align: right;
	}
</style>
