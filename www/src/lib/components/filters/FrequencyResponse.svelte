<script lang="ts">
	import { maxIndex, SampleData, SampleView } from '$lib/audio/sample';
	import type { IirDigital } from '$lib/dsp/iir';
	import { span2d } from '$lib/math/geometry';
	import { throttle } from '$lib/input/debounce';
	import Waveform from '../audio/Waveform.svelte';

	const { filter }: { filter: IirDigital } = $props();
	// let canvas: HTMLCanvasElement = $state();

	const samples = 128;
	// let impulse = $state(new Float32Array(samples));
	let response = $state(new SampleView(new Float32Array(0)));
	let phaseResponse = $state(new SampleView(new Float32Array(0)));

	const calculateResponse = (filter: IirDigital) => {
		// filteredImpulse = new SampleData(filter.apply(impulse));
		let rawResponse = new Float32Array(samples);
		for (let idx = 0; idx < samples; idx++) {
			rawResponse[idx] = filter.frequency_response_norm(idx / samples / 2);
		}
		response = new SampleView(rawResponse);
		const peakIndex = maxIndex(response);
		const peakFreq = filter.max_frequency_response_gradient_ascent(peakIndex / samples / 2);
		// console.log({ peakFreq, val: filter.frequency_response_norm(peakFreq) });

		let rawPhaseResponse = new Float32Array(samples);
		for (let idx = 0; idx < samples; idx++) {
			rawPhaseResponse[idx] = filter.frequency_response_phase(idx / samples / 2);
		}
		phaseResponse = new SampleView(rawPhaseResponse);
	};

	const calculateResponseThrottled = throttle(calculateResponse, 1000 / 30);

	$effect(() => {
		calculateResponseThrottled(filter);
	});
</script>

<div>
	<Waveform data={response} span={span2d(0, 1, 0, 1.1)} samplerate={samples} />
	<Waveform data={phaseResponse} span={span2d(0, 1, -4, 4)} samplerate={samples} />
	<!-- <button
		onclick={() => {
			impulse.fill(0);
			impulse[0] = 1.0;
			// console.log(impulse);
			applyFilter(filter, impulse);
		}}>Impulse</button
	>
	<button
		onclick={() => {
			impulse.fill(0);
			for (let idx = 20; idx < samples; idx++) {
				impulse[idx] = 1.0;
			}
			applyFilter(filter, impulse);
		}}>Step</button
    > -->
	<!-- <canvas bind:this={canvas}></canvas> -->
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
