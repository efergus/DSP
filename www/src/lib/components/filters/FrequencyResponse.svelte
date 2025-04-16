<script lang="ts">
	import { maxIndex, SampleView } from '$lib/audio/sample';
	import type { IirDigital } from '$lib/dsp/iir';
	import { span2d } from '$lib/math/span';
	import { throttle } from '$lib/input/debounce';
	import Waveform from '../audio/Waveform.svelte';

	const { filter, decibels }: { filter: IirDigital; decibels?: boolean } = $props();
	// let canvas: HTMLCanvasElement = $state();

	const samples = 128;
	// let impulse = $state(new Float32Array(samples));
	const frequencySpan = $derived(decibels ? span2d(0, 1, -50, 10) : span2d(0, 1, 0, 1));
	let response = $state(new SampleView(new Float32Array(0)));
	let phaseResponse = $state(new SampleView(new Float32Array(0)));

	const calculateResponse = (filter: IirDigital) => {
		// filteredImpulse = new SampleData(filter.apply(impulse));
		let rawResponse = new Float32Array(samples);
		for (let idx = 0; idx < samples; idx++) {
			const response = filter.frequency_response_norm(idx / samples / 2);
			rawResponse[idx] = decibels ? Math.log10(response) * 10 : response;
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
	<Waveform data={response} span={frequencySpan} samplerate={samples} height={120} />
	<Waveform data={phaseResponse} span={span2d(0, 1, -4, 4)} samplerate={samples} height={120} />
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
