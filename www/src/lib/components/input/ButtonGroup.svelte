<script lang="ts">
	const { children } = $props();
</script>

<div class="buttons">
	{@render children?.()}
</div>

<style lang="less">
	.buttons {
		display: flex;
		justify-content: stretch;
		border: 1px solid black;

		> :global(*) {
			border: none;
		}
		> :global(div) {
			flex-grow: 1;
		}
		> :global(:not(:last-child)) {
			border-right: 1px solid silver;
		}
	}
</style>
