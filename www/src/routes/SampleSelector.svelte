<script lang="ts">
	import Button from '$lib/components/input/Button.svelte';
	import { SampleType } from '$lib/state/sample_selector';
	import SinWave from '$lib/icons/SinWave.svelte';
	import SquareWave from '$lib/icons/SquareWave.svelte';
	import SawWave from '$lib/icons/SawWave.svelte';
	import TriangleWave from '$lib/icons/TriangleWave.svelte';
	import WhiteNoise from '$lib/icons/WhiteNoise.svelte';
	import Chirp from '$lib/icons/Chirp.svelte';

	let {
		selected = $bindable(SampleType.SQUARE)
	}: {
		selected?: SampleType;
	} = $props();

	const samples = [
		{ type: SampleType.SINE, name: 'Sine Wave', icon: SinWave },
		{ type: SampleType.SQUARE, name: 'Square Wave', icon: SquareWave },
		{ type: SampleType.SAWTOOTH, name: 'Sawtooth Wave', icon: SawWave },
		{ type: SampleType.TRIANGLE, name: 'Triangle Wave', icon: TriangleWave },
		{ type: SampleType.NOISE, name: 'Noise', icon: WhiteNoise },
		{ type: SampleType.CHIRP, name: 'Chirp', icon: Chirp }
	];

	$inspect(selected);
</script>

{#each samples as sample}
	<Button
		onclick={() => (selected = sample.type)}
		class={selected === sample.type ? 'selected' : ''}
		title={sample.name}
	>
		<sample.icon />
	</Button>
{/each}
