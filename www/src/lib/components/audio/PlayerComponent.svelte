<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData } from '$lib/audio/sample';
	import { span1d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import type { MouseStateHandler } from '$lib/input/mouse';
	import type { Snippet } from 'svelte';
	import Axis from './Axis.svelte';
	import Waveform from './Waveform.svelte';
	import { Player } from '$lib/audio/player';
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import Button from '../input/Button.svelte';
	import Spectrogram from './Spectrogram.svelte';
	import PlayPixel from '$lib/icons/PlayPixel.svelte';

	let {
		data,
		filteredData,
		span = $bindable(),
		onmouse,
		children,
		before
	}: {
		data: SampleData;
		filteredData?: SampleData;
		span: Span2D;
		onmouse?: MouseStateHandler;
		children?: Snippet;
		before?: Snippet;
	} = $props();

	let spectrumVerticalSpan = $state(span1d(0, data.samplerate / 2));
</script>

<div class="stack">
	<div class="buttons">
		{@render before?.()}
		{@render children?.()}
	</div>
</div>

<style lang="less">
</style>
