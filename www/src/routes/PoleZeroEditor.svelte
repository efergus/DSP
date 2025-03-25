<script lang="ts">
	import {
		complex_conjugate,
		complex_dist,
		complex_div_scalar,
		complex_norm,
		type Complex
	} from '$lib/dsp/complex';
	import { addConjugates } from '$lib/dsp/iir';
	import PoleZeroPlot, { type ComplexMouseState } from './PoleZeroPlot.svelte';
	import RootEditor from './RootEditor.svelte';
	import type { Root } from '$lib/dsp/iir';

	let {
		roots = $bindable([]),
		width = 300,
		height = 300,
		padding = 0.2,
		select_size = 40,
		conjugate = false,
		onchange
	}: {
		roots: Root[];
		width?: number;
		height?: number;
		padding?: number;
		select_size?: number;
		conjugate?: boolean;
		onchange?: (zeros: Complex[], poles: Complex[]) => void;
	} = $props();

	let pad = $derived(1 + padding);
	let scale = $derived(Math.min(width, height) / pad / 2);
	let selectThreshold = $derived(select_size / scale);

	let hovered: number = $state(-1);
	let active: number = $state(-1);
	let activeCount: number = $state(0);

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
		let selected = closestPoint(mousePos, roots);
		hovered = selected;
	};

	const handleMouse = (state: ComplexMouseState) => {
		let pos = state.complexPos;
		let delta = state.complexDelta;
		if (state.edgeDown) {
			let closest = closestPoint(pos, roots);
			activeCount = active === closest ? activeCount + 1 : 0;
			active = closest;
		}
		if (state.click) {
			if (active < 0) {
				active = roots.length;
				roots = roots.concat([
					{
						state: 0,
						val: pos
					}
				]);
			} else if (state.elapsed < 1) {
				if (activeCount > 0) {
					let ref = roots[active];
					roots[active] = {
						...ref,
						state: (ref.state + 1) % 3
					};
				}
			}
		}
		if (state.down && active >= 0 && complex_norm(delta) > 0) {
			let newVal = pos;
			if (conjugate && newVal.im < 0) {
				newVal = complex_conjugate(newVal);
			}
			let norm = complex_norm(newVal);
			if (norm > 1.0) {
				newVal = complex_div_scalar(newVal, norm);
			}
			roots[active] = {
				...roots[active],
				val: newVal
			};
			roots = roots;
		}
		handleHover(pos);
	};

	const handleDelete = (index: number) => {
		roots = roots.toSpliced(index, 1);
		if (active >= roots.length) {
			active = -1;
		}
	};

	const addConjugateRoots = conjugate ? addConjugates : (arr: Complex[]) => arr;
	let zeros = $derived(addConjugateRoots(roots.filter((x) => x.state === 0).map((x) => x.val)));
	let poles = $derived(addConjugateRoots(roots.filter((x) => x.state === 1).map((x) => x.val)));
	let dead = $derived(addConjugateRoots(roots.filter((x) => x.state === 2).map((x) => x.val)));

	$effect(() => onchange?.(zeros, poles));

	let visuallySelected = $derived(hovered >= 0 ? hovered : active);
</script>

<div>
	<PoleZeroPlot
		{zeros}
		{poles}
		{dead}
		{width}
		{height}
		hover={visuallySelected >= 0 ? roots[visuallySelected]?.val : null}
		onmouse={handleMouse}
	/>
	<div>
		{#each roots as root, index}
			<RootEditor
				polar={true}
				bind:value={roots[index]}
				hovered={visuallySelected === index}
				ondelete={() => handleDelete(index)}
				onenter={() => {
					hovered = index;
				}}
				onleave={() => {
					hovered = -1;
				}}
				onfocus={() => {
					active = index;
				}}
			/>
		{/each}
	</div>
</div>

<style lang="less">
	div {
		display: flex;
		gap: 0.5em;
	}

	div > div {
		flex-direction: column;
		max-width: 300px;
	}
</style>
