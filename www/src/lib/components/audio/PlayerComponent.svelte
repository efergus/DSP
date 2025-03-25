<script lang="ts">
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from '$lib/audio/sample';
	import { span2d, type Span2D } from '$lib/math/span';
	import type { MouseStateHandler } from '$lib/input/mouse';
	import type { Snippet } from 'svelte';
	import Axis from './Axis.svelte';
	import Waveform from './Waveform.svelte';
	import { Player } from '$lib/audio/player';
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import Button from '../input/Button.svelte';

	let {
		data,
		span = $bindable(),
		onmouse,
		children
	}: {
		data: Sample;
		span: Span2D;
		onmouse?: MouseStateHandler;
		children?: Snippet;
	} = $props();
</script>

<div>
	<div class="audio">
		<Waveform {data} bind:span />
		<!-- <Spectrogram {data} bind:span /> -->
	</div>
	<div class="buttons">
		{@render children?.()}
		<Button
			onclick={() => {
				const player = new PlayerWithFilter();
				player.play(new SampleData(data));
			}}
		>
			Play
		</Button>
	</div>
</div>

<style lang="less">
	.audio {
		display: flex;
		justify-content: space-between;
	}

	.buttons {
		margin-top: 24px;
		display: flex;
		justify-content: stretch;
		> :global(*:not(:first-child)) {
			border-left: none;
		}
		> :global(*:not(:last-child)) {
			border-right-color: silver;
		}
		> :global(div.spacer) {
			flex-grow: 1;
			border-style: solid;
			border-top-color: black;
			border-bottom-color: black;
			border-left: none;
			border-width: 1px;
			margin: 0px;
		}
	}
</style>
