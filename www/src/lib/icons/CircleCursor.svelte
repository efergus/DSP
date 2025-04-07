<script lang="ts">
	const {
		size = 6,
		stroke = 0,
		color = 'currentColor',
		fill = color,
		x = 0,
		y = 0
	}: {
		size?: number;
		stroke?: number;
		color?: string;
		fill?: string;
		x?: number;
		y?: number;
	} = $props();

	const center = $derived(size / 2);
	const radius = $derived(size / 2 - stroke / 2);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox={`0 0 ${size} ${size}`}
	stroke-width={stroke}
	stroke={color}
	{fill}
	style:position="absolute"
	style:top="0px"
	style:left="0px"
	style:pointer-events="none"
	style:width="{size}px"
	style:height="{size}px"
	style:transform="translate({x - center}px, {y - center}px)"
>
	<circle cx={center} cy={center} r={radius} />
</svg>
