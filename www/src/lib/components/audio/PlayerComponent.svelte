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
	<div class="audio">
		<Waveform {data} {filteredData} bind:span height={250} />
		<Spectrogram
			height={250}
			{data}
			logScale
			bind:span={() => span2dFromSpans(span.x, spectrumVerticalSpan),
			(newSpan) => {
				spectrumVerticalSpan = newSpan.y;
				span = span2dFromSpans(newSpan.x, span.y);
			}}
		/>
	</div>
	<div class="buttons">
		{@render before?.()}
		<Button
			slim
			onclick={() => {
				const player = new PlayerWithFilter();
				player.play(data);
			}}
		>
			<PlayPixel />
		</Button>
		{@render children?.()}
	</div>
</div>

<style lang="less">
	.stack {
		display: flex;
		flex-direction: column;
		max-width: min-content;

		> :not(:last-child) {
			border-bottom: none;
		}
	}

	.audio {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid black;
	}

	.buttons {
		display: flex;
		justify-content: stretch;
		border: 1px solid black;

		> :global(*) {
			border: none;
		}
		> :global(:not(:last-child)) {
			border-right: 1px solid silver;
		}
		> :global(div.spacer) {
			flex-grow: 1;
			// border-style: solid;
			// border-top-color: black;
			// border-bottom-color: black;
			// border-left: none;
			// border-width: 1px;
			margin: 0px;
		}
	}
</style>
