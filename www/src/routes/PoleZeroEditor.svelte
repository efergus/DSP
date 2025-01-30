<script lang="ts">
	import {
		complex,
		complex_add,
		complex_conjugate,
		complex_dist,
		complex_div_scalar,
		complex_norm,
		complex_norm2,
		complex_sub,
		type Complex
	} from '$lib/audio/complex';
	import { addConjugates } from '$lib/audio/iir';
	import type { MouseState } from '$lib/input/state';
	import PoleZeroPlot, { type ComplexMouseState } from './PoleZeroPlot.svelte';
	import RootEditor from './RootEditor.svelte';

	export type Root = {
		state: number;
		val: Complex;
	};

	let {
		roots = $bindable([]),
		width = 300,
		height = 300,
		padding = 0.2,
		select_size = 40,
		onchange
	}: {
		roots: Root[];
		width?: number;
		height?: number;
		padding?: number;
		select_size?: number;
		onchange?: (zeros: Complex[], poles: Complex[]) => void;
	} = $props();

	let pad = $derived(1 + padding);
	let scale = $derived(Math.min(width, height) / pad / 2);
	let selectThreshold = $derived(select_size / scale);

	let hover: Root | null = $state(null);
	let active: number = $state(-1);

	const closestPoint = (pos: Complex, arr: Root[], threshold = selectThreshold / 2): number => {
		let closest = -1;
		let closest_distance = threshold;
		for (let index = 0; index < arr.length; index++) {
			let val = arr[index].val;
			let dist = Math.min(complex_dist(pos, val), complex_dist(pos, complex_conjugate(val)));
			if (dist <= closest_distance) {
				closest = index;
				closest_distance = dist;
			}
		}
		return closest;
	};

	const selectedRoot = (pos: Complex): Root | null => {
		let index = closestPoint(pos, roots);
		if (index >= 0) {
			return roots[index];
		}
		return null;
	};

	const handleHover = (mousePos: Complex) => {
		if (active >= 0) {
			hover = roots[active];
			return;
		}
		let selected = selectedRoot(mousePos);
		hover = selected;
	};

	const handleMouse = (state: ComplexMouseState) => {
		let pos = state.complexPos;
		let delta = state.complexDelta;
		if (state.edgeDown) {
			active = closestPoint(pos, roots);
		}
		if (state.click) {
			if (active < 0) {
				roots = roots.concat([
					{
						state: 0,
						val: pos
					}
				]);
			} else if (state.elapsed < 1) {
				let ref = roots[active];
				ref.state = (ref.state + 1) % 3;
			}
		}
		if (!state.down) {
			active = -1;
		}
		if (active >= 0 && complex_norm(delta) > 0) {
			let newVal = pos;
			if (newVal.im < 0) {
				newVal = complex_conjugate(newVal);
			}
			let norm = complex_norm(newVal);
			if (norm > 1.0) {
				newVal = complex_div_scalar(newVal, norm);
			}
			roots[active].val = newVal;
			roots = roots;
		}
		handleHover(pos);
	};

	let zeros = $derived(addConjugates(roots.filter((x) => x.state === 0).map((x) => x.val)));
	let poles = $derived(addConjugates(roots.filter((x) => x.state === 1).map((x) => x.val)));
	let dead = $derived(addConjugates(roots.filter((x) => x.state === 2).map((x) => x.val)));

	$effect(() => onchange?.(zeros, poles));
</script>

<div>
	<PoleZeroPlot
		{zeros}
		{poles}
		{dead}
		{width}
		{height}
		hover={hover?.val ?? null}
		onmouse={handleMouse}
	/>
	{#each roots as root, index}
		<RootEditor polar={true} bind:value={roots[index]} />
	{/each}
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		max-width: 300px;
	}
</style>
