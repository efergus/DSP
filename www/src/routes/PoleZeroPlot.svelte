<script lang="ts">
	import type { Complex } from '$lib/audio/complex';
	import { context } from '$lib/dsp/dsp';
	import Circle from '$lib/icons/Circle.svelte';
	// import type { Iir } from '$lib/audio/iir';

	let {
		zeros,
		poles,
		width = 300,
		height = 300,
		padding = 0.2,
		zero_size = 8,
		pole_size = 8
	}: {
		zeros: Complex[];
		poles: Complex[];
		width?: number;
		height?: number;
		padding?: number;
		zero_size?: number;
		pole_size?: number;
	} = $props();

	let pad = $derived(1 + padding);
	let scale = $derived(Math.min(width, height) / pad / 2);

	let canvas: HTMLCanvasElement;

	const val2px = (val: number) => val * scale;

	const px2val = (val: number) => val / scale;

	const pos2px = (x: number, y: number) => ({
		x: width / 2 + x * scale,
		y: height / 2 - y * scale
	});

	const px2pos = (x: number, y: number) => ({
		x: (width / 2 - x) / scale,
		y: (height / 2 - y) / scale
	});

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

	const draw_unit_circle = (context: CanvasRenderingContext2D) => {
		let center = pos2px(0, 0);
		let radius = val2px(1);

		context.strokeStyle = 'rgb(120 120 120)';
		context.lineWidth = 2;
		context.beginPath();
		context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
		context.fillStyle = 'rgb(210 210 210)';
		context.fill();
		context.stroke();
	};

	// type DrawCircleOptions = {
	// 	strokeStyle?: string;
	// 	lineWidth?: number;
	// 	fillStyle?: string;
	// 	radius?: number;
	// };
	// const draw_circle = (
	// 	context: CanvasRenderingContext2D,
	// 	pos: Complex,
	// 	options: DrawCircleOptions = {}
	// ) => {
	// 	let {
	// 		strokeStyle = 'rgb(0 0 0)',
	// 		lineWidth = 2,
	// 		fillStyle = 'rgb(0 0 0)',
	// 		radius = zero_size / 2
	// 	} = options;

	// 	let center = pos2px(pos.re, pos.im);

	// 	context.strokeStyle = strokeStyle;
	// 	context.lineWidth = lineWidth;
	// 	context.fillStyle = fillStyle;
	// 	context.beginPath();
	// 	context.arc(center.x, center.y, radius - lineWidth / 2, 0, 2 * Math.PI);
	// 	context.fill();
	// 	if (lineWidth) {
	// 		context.stroke();
	// 	}
	// };

	const draw = (context: CanvasRenderingContext2D, zeros: Complex[], poles: Complex[]) => {
		clear(context);
		draw_unit_circle(context);
		draw_axes(context);
		// for (let i = 0; i < zeros.length; i++) {
		// 	draw_circle(context, zeros[i], {
		// 		fillStyle: 'none'
		// 	});
		// }
	};

	$effect(() => {
		let context = canvas?.getContext('2d');
		if (!context) {
			return;
		}
		draw(context, zeros, poles);
	});

	let zero_positions = $derived(zeros.map(({ re, im }) => pos2px(re, im)));
	let pole_positions = $derived(poles.map(({ re, im }) => pos2px(re, im)));
</script>

<div class="container">
	<canvas bind:this={canvas} {width} {height}></canvas>
	<div class="fill" style={`width: ${width}px; height: ${height}px;`}>
		{#each zero_positions as zero}
			<div
				class="zero"
				style={`transform: translate(${zero.x - zero_size / 2}px, ${zero.y - zero_size / 2}px)`}
			>
				<Circle size={zero_size} />
			</div>
		{/each}

		{#each pole_positions as pole}
			<div
				class="pole"
				style={`transform: translate(${pole.x - pole_size / 2}px, ${pole.y - pole_size / 2}px)`}
			>
				<Circle size={zero_size} fill="rgb(240 0 0)" stroke="rgb(240 0 0)" />
			</div>
		{/each}
	</div>
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

	.zero,
	.pole {
		position: absolute;
		display: flex;
	}
</style>
