<script lang="ts">
	let {
		size = 24,
		width,
		height,
		fill = 'none',
		stroke = 'currentColor',
		strokeWidth = 2
	}: {
		size?: number;
		width?: number;
		height?: number;
		fill?: string;
		stroke?: string;
		strokeWidth?: number;
	} = $props();

	width = width ?? height ?? size;
	height = height ?? width ?? size;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	{fill}
	{stroke}
	viewBox="0 0 24 24"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="feather feather-pause"
	><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"
	></rect></svg
>
