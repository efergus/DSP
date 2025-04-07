<script lang="ts">
	import type { LongCursorPathProps } from './long_cursor_path';

	const {
		size = 6,
		stroke = 1,
		x: xPos = 0,
		span,
		color = 'currentColor'
	}: LongCursorPathProps = $props();

	const height = $derived(span.y.size());
	const halfSize = $derived(size / 2);
</script>

<path d={`M ${xPos - halfSize},0 l ${halfSize},${halfSize} ${halfSize},-${halfSize}`} />
<path stroke={color} d={`M ${xPos},${halfSize - stroke} V ${height - halfSize + stroke}`} />
<path d={`M ${xPos - halfSize},${height} l ${halfSize},-${halfSize} ${halfSize},${halfSize}`} />
