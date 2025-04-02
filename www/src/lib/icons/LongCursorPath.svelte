<script lang="ts">
	import { Spring } from 'svelte/motion';
	import type { LongCursorPathProps } from './long_cursor_path';

	const {
		size = 6,
		stroke = 1,
		x = 0,
		span,
		color = 'currentColor'
	}: LongCursorPathProps = $props();

	const height = $derived(span.y.size());
	const halfSize = $derived(size / 2);

	const springPosition = new Spring(x, {
		stiffness: 4,
		damping: 0.96
	});

	$effect(() => {
		springPosition.set(x);
	});
</script>

<path
	d={`M ${springPosition.current - halfSize},0 l ${halfSize},${halfSize} ${halfSize},-${halfSize}`}
/>
<path
	stroke={color}
	d={`M ${springPosition.current},${halfSize - stroke} V ${height - halfSize + stroke}`}
/>
<path
	d={`M ${springPosition.current - halfSize},${height} l ${halfSize},-${halfSize} ${halfSize},${halfSize}`}
/>
