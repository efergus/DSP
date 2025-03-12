<script lang="ts">
	import { complex, complex_conjugate, type Complex } from '$lib/dsp/complex';
	import { span2d } from '$lib/math/geometry';
	import { mouse, type MouseState } from '$lib/input/mouse';

	export type ComplexMouseState = {
		complexPos: Complex;
		complexDelta: Complex;
		scale: number;
	} & MouseState;

	let {
		zeros,
		poles,
		dead,
		hover = null,
		width = 300,
		height = 300,
		padding = 0.2,
		zero_size = 8,
		pole_size = 8,
		pad_size = 20,
		onmouse
	}: {
		zeros: Complex[];
		poles: Complex[];
		dead?: Complex[];
		hover: Complex | null;
		width?: number;
		height?: number;
		padding?: number;
		zero_size?: number;
		pole_size?: number;
		pad_size?: number;
		onmouse?: (state: ComplexMouseState) => void;
	} = $props();

	let pad = $derived(1 + padding);
	let scale = $derived(Math.min(width, height) / pad / 2);

	let canvas: HTMLCanvasElement;

	const val2px = (val: number) => val * scale;

	const px2val = (val: number) => val / scale;

	const px2pos = (x: number, y: number) => ({
		x: (x - width / 2) / scale,
		y: (height / 2 - y) / scale
	});

	const pos2px = (x: number, y: number) => ({
		x: width / 2 + x * scale,
		y: height / 2 - y * scale
	});

	const mousePos = (e: MouseState) => {
		let canvasRect = (e.target as HTMLCanvasElement).getBoundingClientRect();
		let mouseX = e.pos.x - canvasRect.x;
		let mouseY = e.pos.y - canvasRect.y;
		let pos = px2pos(mouseX, mouseY);
		return complex(pos.x, pos.y);
	};

	const clear = (context: CanvasRenderingContext2D) => {
		context.fillStyle = 'rgb(255 255 255)';
		context.fillRect(0, 0, canvas.width, canvas.height);
	};

	const draw_axes = (context: CanvasRenderingContext2D) => {
		let top = pos2px(0, pad);
		let bottom = pos2px(0, -pad);
		let left = pos2px(-pad, 0);
		let right = pos2px(pad, 0);

		context.strokeStyle = 'rgb(120 120 120)';
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(top.x, top.y);
		context.lineTo(bottom.x, bottom.y);
		context.stroke();
		context.moveTo(left.x, left.y);
		context.lineTo(right.x, right.y);
		context.stroke();
	};

	type DrawCircleOptions = {
		radius?: number;
		fillStyle?: string;
		strokeStyle?: string;
		lineWidth?: number;
		conjugate?: boolean;
	};

	const draw_circle = (
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
			const center = pos2px(pos.re, pos.im);
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

	const draw_unit_circle = (context: CanvasRenderingContext2D) => {
		draw_circle(context, complex(0, 0), {
			radius: val2px(1),
			strokeStyle: 'rgb(120 120 120)',
			lineWidth: 2,
			fillStyle: 'rgb(210 210 210)'
		});
	};

	const draw = (
		context: CanvasRenderingContext2D,
		zeros: Complex[],
		poles: Complex[],
		hover: Complex | null
	) => {
		clear(context);
		draw_unit_circle(context);
		draw_axes(context);
		if (hover) {
			draw_circle(context, hover, { radius: pad_size / 2, fillStyle: 'rgba(0, 0, 0, 0.2)' });
			draw_circle(context, complex_conjugate(hover), {
				radius: pad_size / 2,
				fillStyle: 'rgba(0, 0, 0, 0.2)'
			});
		}
		draw_circle(context, zeros, {
			strokeStyle: 'black',
			radius: zero_size / 2
		});
		draw_circle(context, poles, {
			fillStyle: 'red',
			radius: pole_size / 2
		});
		draw_circle(context, dead ?? [], {
			fillStyle: 'blue',
			radius: zero_size / 2
		});
	};

	$effect(() => {
		let context = canvas?.getContext('2d');
		if (!context) {
			return;
		}
		draw(context, zeros, poles, hover);
	});
</script>

<div class="container">
	<canvas
		bind:this={canvas}
		{width}
		{height}
		{...mouse(
			(state) => {
				let pos = complex(state.pos.x, state.pos.y);
				let delta = complex(px2val(state.delta.x), val2px(-state.delta.y));
				onmouse?.({
					complexPos: pos,
					complexDelta: delta,
					scale,
					...state
				});
			},
			{
				remap: span2d(-pad, pad, -pad, pad)
			}
		)}
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
