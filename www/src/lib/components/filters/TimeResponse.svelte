<script lang="ts">
	import { SampleData } from '$lib/audio/sample';
	import type { IirDigital } from '$lib/dsp/iir';
	import { span2d } from '$lib/geometry/geometry';
	import { throttle } from '$lib/input/debounce';
	import Waveform from '../audio/Waveform.svelte';

	const { filter }: { filter: IirDigital } = $props();

	const samples = 128;
	let impulse = $state(new Float32Array(samples));
	let filteredImpulse = $state(new SampleData());

	const applyFilter = (filter: IirDigital, impulse: Float32Array) => {
		filteredImpulse = new SampleData(filter.apply(impulse));
	};

	const applyFilterThrottled = throttle(applyFilter);

	$effect(() => {
		applyFilterThrottled(filter, impulse);
	});
</script>

<div>
	<div class="inner">
		<button
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
	</div>
	<Waveform data={filteredImpulse} span={span2d(0, filteredImpulse.duration(), -1, 1)} />
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	div.inner {
		flex-direction: row;
	}
</style>
