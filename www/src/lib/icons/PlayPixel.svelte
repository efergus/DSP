<script lang="ts">
	let {
		size = 24,
		width,
		height,
		fill = 'currentColor',
		stroke = 'none'
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
		<path
			d="M 5,22 V 2 h 4 v 2 h 3 v 2 h 3 v 2 h 3 v 2 h 3 v 4 h -3 v 2 h -3 v 2 h -3 v 2 H 9 v 2 z"
		/>
	</g>
</svg>
