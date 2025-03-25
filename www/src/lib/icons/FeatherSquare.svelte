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
	stroke-width={strokeWidth}
	viewBox="0 0 24 24"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="feather feather-square"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg
>
