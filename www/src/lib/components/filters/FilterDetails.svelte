<script lang="ts">
	import type { IirDigital } from '$lib/dsp/iir';
	import TimeResponse from './TimeResponse.svelte';

	const { filter }: { filter: IirDigital } = $props();
</script>

<TimeResponse {filter} />
