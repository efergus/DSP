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
		<path
			d="M 2,8 H 4 V 6 H 6 V 4 H 8 V 2 h 8 v 2 h 2 v 2 h 2 v 2 h 2 v 8 h -2 v 2 h -2 v 2 h -2 v 2 H 8 V 20 H 6 V 18 H 4 V 16 H 2 Z"
		/>
	</g>
</svg>
