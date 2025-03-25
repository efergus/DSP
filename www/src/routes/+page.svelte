<script>
	import Designer from './Designer.svelte';
</script>

<div class="page">
	<div></div>
	<div class="content">
		<Designer />
	</div>
	<div></div>
</div>

<style lang="less">
	div.page {
		width: 100%;

		display: grid;
		grid-template-rows: minmax(48px, 0.2fr) auto 0.4fr;
	}
	div.content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
