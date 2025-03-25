<script lang="ts">
	let {
		size = 24,
		width,
		height,
		fill = 'none',
		stroke = 'currentColor'
	}: {
		size?: number;
		width?: number;
		height?: number;
		fill?: string;
		stroke?: string;
	} = $props();

	width = width ?? height ?? size;
	height = height ?? width ?? size;
</script>

<svg
	{width}
	{height}
	viewBox="0 0 24 24"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	{fill}
	{stroke}
	shape-rendering="crispEdges"
>
	<g>
		<path d="m 2,6 v 12 h 4 v 4 h 12 v -4 h 4 V 6 H 18 V 2 H 6 v 4 z" />
	</g>
</svg>
