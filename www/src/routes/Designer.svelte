<script lang="ts">
	import { AudioSample } from '$lib/audio/sample';
	import Tape from '$lib/components/audio/Tape.svelte';
	import FilterExplorer from '$lib/components/filters/FilterExplorer.svelte';
	import IirFilterEditor from '$lib/components/filters/IirFilterEditor.svelte';
	import { span2d } from '$lib/geometry/geometry';

	let data: AudioSample = $state(new AudioSample());

	let window = 1;
	let start = $derived(Math.max(0, data.duration() - window));
	// $inspect(start);
</script>

<Tape span={span2d(start, start + window, -0.2, 0.2)} onData={(sample) => (data = sample)} />
<IirFilterEditor />
<FilterExplorer />
