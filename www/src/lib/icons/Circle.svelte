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
	viewBox={`0 0 ${width} ${height}`}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="feather feather-circle"
	><circle
		cx={width / 2}
		cy={height / 2}
		r={Math.floor(Math.min(width, height) / 2) - strokeWidth / 2}
	></circle></svg
>
