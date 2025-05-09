<script lang="ts">
	import Button from '$lib/components/input/Button.svelte';
	import { SAMPLE_TYPES, SampleType } from '$lib/state/sample_selector';

	let {
		value = $bindable(SampleType.SQUARE),
		onChange
	}: {
		value?: SampleType;
		onChange?: (sample_type: SampleType) => void;
	} = $props();

	const setType = (sample_type: SampleType) => {
		value = sample_type;
		onChange?.(sample_type);
	};
</script>

{#each SAMPLE_TYPES as sample_type}
	<Button
		onclick={() => {
			setType(sample_type.type);
		}}
		class={value === sample_type.type ? 'selected' : ''}
		title={sample_type.name}
	>
		<sample_type.icon />
	</Button>
{/each}
