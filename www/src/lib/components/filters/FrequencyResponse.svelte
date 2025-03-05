<script lang="ts">
	import { SampleData } from '$lib/audio/sample';
	import type { IirDigital } from '$lib/dsp/iir';
	import { span2d } from '$lib/geometry/geometry';
	import { throttle } from '$lib/input/debounce';
	import Waveform from '../audio/Waveform.svelte';

	const { filter }: { filter: IirDigital } = $props();

	const samples = 512;
	// let impulse = $state(new Float32Array(samples));
	let response = $state(new Float32Array(0));

	const calculateResponse = (filter: IirDigital) => {
		// filteredImpulse = new SampleData(filter.apply(impulse));
	};

	const calculateResponseThrottled = throttle(calculateResponse);

	$effect(() => {
		calculateResponseThrottled(filter);
	});
</script>

<div>
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
	>
	<Waveform data={filteredImpulse} span={span2d(0, filteredImpulse.duration(), -10, 10)} /> -->
</div>
