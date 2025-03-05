<script lang="ts">
	import type { IirDigital } from '$lib/dsp/iir';
	import FrequencyResponse from './FrequencyResponse.svelte';
	import TimeResponse from './TimeResponse.svelte';

	const { filter }: { filter: IirDigital } = $props();
</script>

<TimeResponse {filter} />
<FrequencyResponse {filter} />
