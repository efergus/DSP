<script lang="ts">
	import type { IirDigital } from '$lib/dsp/iir';
	import FrequencyResponse from './FrequencyResponse.svelte';
	import TimeResponse from './TimeResponse.svelte';

	const { filter, samplerate }: { filter: IirDigital; samplerate: number } = $props();
</script>

<div>
	<!-- <TimeResponse {filter} /> -->
	<FrequencyResponse {filter} {samplerate} decibels />
</div>

<style lang="less">
	div {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
