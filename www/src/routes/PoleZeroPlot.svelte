<script lang="ts">
	import {
		complex,
		complex_add,
		complex_conjugate,
		complex_copy,
		complex_dist,
		complex_div_scalar,
		complex_norm,
		complex_sub,
		type Complex
	} from '$lib/dsp/complex';
	import { Span2D, span2d } from '$lib/math/span';
	import { mouseDispatch, type MouseState } from '$lib/input/mouse';
	import type { Root } from '$lib/dsp/iir';
	import { point } from '$lib/math/point';

	export type ComplexMouseState = {
		complexPos: Complex;
		complexDelta: Complex;
		scale: number;
	} & MouseState;

	let {
		roots = $bindable([]),
		hover = $bindable(null),
		active = $bindable(null),
		width = 250,
		height = 250,
		zero_size = 8,
		pole_size = 8,
		hover_size = 16,
		zPlane = false,
		span
	}: {
		roots: Root[];
		hover: number | null;
		active: number | null;
		span: Span2D;
		width?: number;
		height?: number;
		zero_size?: number;
		pole_size?: number;
		hover_size?: number;
		zPlane?: boolean;
	} = $props();

	const screenSpan = $derived(span2d(0, width, height, 0));
	const poles = $derived(roots.filter((r) => r.degree < 0));
	const zeros = $derived(roots.filter((r) => r.degree > 0));
	const selectThreshold = $derived(screenSpan.x.remapSize(hover_size / 2, span.x));

	let mouseDragOffset: Complex = $state(complex());

	let canvas: HTMLCanvasElement;

	const clear = (context: CanvasRenderingContext2D) => {
		context.fillStyle = 'rgb(220 220 220)';
		context.fillRect(0, 0, canvas.width, canvas.height);
	};

	const drawAxes = (context: CanvasRenderingContext2D) => {
		const top = screenSpan.y.min;
		const left = screenSpan.x.start;
		const width = screenSpan.x.size();
		const height = screenSpan.y.size();
		const centerX = Math.floor(span.x.remap(0, screenSpan.x));
		const centerY = Math.floor(span.y.remap(0, screenSpan.y));

		context.fillStyle = 'black';
		context.fillRect(centerX, top, 1, height);
		context.fillRect(left, centerY, width, 1);
	};

	type DrawCircleOptions = {
		radius?: number;
		fillStyle?: string;
		strokeStyle?: string;
		lineWidth?: number;
		conjugate?: boolean;
	};

	const drawCircle = (
		context: CanvasRenderingContext2D,
		pos: Complex | Complex[],
		options: DrawCircleOptions = {}
	) => {
		let posArr;
		if (Array.isArray(pos)) {
			posArr = pos;
		} else {
			posArr = [pos];
		}
		const { radius = zero_size / 2, fillStyle, strokeStyle, lineWidth = 2 } = options;

		for (let pos of posArr) {
			const center = span.remap(point(pos.re, pos.im), screenSpan);
			context.beginPath();
			context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
			if (fillStyle) {
				context.fillStyle = fillStyle;
				context.fill();
			}
			if (strokeStyle) {
				context.strokeStyle = strokeStyle;
				context.lineWidth = lineWidth;
				context.stroke();
			}
		}
	};

	const drawUnitCircle = (context: CanvasRenderingContext2D) => {
		drawCircle(context, complex(0, 0), {
			radius: span.x.remapSize(1, screenSpan.x),
			strokeStyle: 'black',
			lineWidth: 1,
			fillStyle: 'white'
		});
	};

	const draw = (
		context: CanvasRenderingContext2D,
		zeros: Root[],
		poles: Root[],
		hover: Complex | null
	) => {
		clear(context);
		if (zPlane) {
			drawUnitCircle(context);
		}
		drawAxes(context);

		if (hover) {
			drawCircle(context, hover, { radius: hover_size / 2, fillStyle: 'rgba(0, 0, 0, 0.2)' });
			drawCircle(context, complex_conjugate(hover), {
				radius: hover_size / 2,
				fillStyle: 'rgba(0, 0, 0, 0.2)'
			});
		}
		const conjugatedZeros = zeros.map((z) => complex_conjugate(z.val));
		const conjugatedPoles = poles.map((z) => complex_conjugate(z.val));
		drawCircle(context, [...zeros.map((z) => z.val), ...conjugatedZeros], {
			strokeStyle: 'black',
			radius: zero_size / 2
		});
		drawCircle(context, [...poles.map((z) => z.val), ...conjugatedPoles], {
			fillStyle: 'red',
			radius: pole_size / 2
		});
	};

	const closestPoint = (pos: Complex, arr: Root[], threshold = selectThreshold): number => {
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

	const zPlaneLimit = (pos: Complex): Complex => {
		if (pos.im < 0) {
			pos = complex(pos.re, 0);
		}
		const norm = complex_norm(pos);
		if (norm > 1) {
			return complex_div_scalar(pos, norm);
		}
		return pos;
	};

	const sPlaneLimit = (pos: Complex): Complex => {
		if (pos.im < 0) {
			pos = complex(pos.re, 0);
		}
		if (pos.re > 0) {
			pos = complex(0, pos.im);
		}
		return pos;
	};

	const limitFn = $derived(zPlane ? zPlaneLimit : sPlaneLimit);

	const handleHover = (mousePos: Complex) => {
		let selected = closestPoint(mousePos, roots);
		hover = selected >= 0 ? selected : null;
	};

	const handleMouse = (pos: Complex, delta: Complex, state: MouseState) => {
		const activeBefore = active;
		// hover
		if (state.edgeDown) {
			let closest = closestPoint(pos, roots);
			active = closest >= 0 ? closest : null;
			if (active !== null) {
				mouseDragOffset = complex_sub(roots[active].val, pos);
			}
		}
		// click to add or delete
		if (state.click) {
			if (active === null) {
				// did not click on a root, add a new root
				active = roots.length;
				roots = roots.concat([
					{
						degree: 1,
						val: pos
					}
				]);
			} else if (active === activeBefore) {
				// clicked on active root, delete it
				const newRoots = roots.slice();
				newRoots.splice(active, 1);
				roots = newRoots;
				active = null;
			}
		}
		// click and drag
		if (state.down && active !== null) {
			const newRoots = roots.slice();
			const newPos = limitFn(complex_add(pos, mouseDragOffset));
			newRoots[active] = {
				...newRoots[active],
				val: newPos
			};
			roots = newRoots;
		}
	};

	$effect(() => {
		let context = canvas?.getContext('2d');
		if (!context) {
			return;
		}
		const hoverComplex = hover === null ? null : roots[hover].val;
		draw(context, zeros, poles, hoverComplex);
	});
</script>

<div class="container">
	<canvas
		bind:this={canvas}
		{width}
		{height}
		{...mouseDispatch((state) => {
			const localPos = screenSpan.remap(state.pos, span);
			const localDelta = screenSpan.remapSize(state.delta, span);
			const complexPos = complex(localPos.x, localPos.y);
			const complexDelta = complex(localDelta.x, localDelta.y);
			handleMouse(complexPos, complexDelta, state);
			handleHover(complexPos);
		})}
	></canvas>
</div>

<style>
	.container {
		position: relative;
	}

	.fill {
		position: absolute;
		left: 0px;
		top: 0px;
	}

	.pad {
		position: absolute;
		display: flex;
		justify-content: center;
		width: var(--pad-size);
		/* height: var(--pad-size); */
		border-radius: var(--pad-size);
	}

	.pad:hover {
		background-color: rgb(1 1 1 / 0.2);
	}
</style>
