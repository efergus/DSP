<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	const {
		children,
		slim,
		...rest
	}: HTMLButtonAttributes & {
		slim?: boolean;
	} = $props();
</script>

<button {...rest}>
	<div class={slim ? '' : 'pad'}>
		{@render children?.()}
	</div>
</button>

<style lang="less">
	button {
		background-color: white;
		border-width: 1px;
		border-style: solid;
		border-radius: 0px;
		border-color: black;

		padding-left: auto;
		padding-right: auto;

		font-family: var(--button-font), sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
		font-variation-settings: 'ROND' 0;
		font-size: 16px;

		text-wrap-mode: nowrap;
		width: max-content;

		&:hover {
			background-color: silver;
		}
	}

	button.selected {
		background-color: black;
		color: white;
	}

	div.pad {
		padding-left: 8px;
		padding-right: 8px;
	}
</style>
