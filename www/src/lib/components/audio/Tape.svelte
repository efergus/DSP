<script lang="ts">
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import { DEFAULT_AUDIO_SAMPLERATE, SampleData } from '$lib/audio/sample';
	import type { IirDigital } from '$lib/dsp/iir';
	import {
		chirpSample,
		phaseNoiseSample,
		pinkNoiseSample,
		whiteNoiseSample
	} from '$lib/dsp/samples';
	import PlayPixel from '$lib/icons/PlayPixel.svelte';
	import { Span1D, span1d, span2d, span2dFromSpans, type Span2D } from '$lib/math/span';
	import Button from '../input/Button.svelte';
	import AudioFileInput from './AudioFileInput.svelte';
	import Spectrogram from './Spectrogram.svelte';
	import Waveform from './Waveform.svelte';

	let {
		data = $bindable(new SampleData()),
		filteredData,
		filter,
		cursor = $bindable(null),
		span = $bindable(span2d(0, 1, -1, 1)),
		frequencySpan = $bindable(span1d(0, data.samplerate / 2)),
		playing = false,
		onData
	}: {
		data?: SampleData;
		filteredData?: SampleData;
		filter?: IirDigital;
		span?: Span2D;
		cursor?: number | null;
		playing?: boolean;
		frequencySpan?: Span1D;
		onData?: (sample: SampleData) => void;
	} = $props();
</script>

<div class="stack">
	<div class="audio">
		<Waveform {data} {filteredData} bind:span bind:cursor width={500} height={250} {playing} />
		<Spectrogram
			width={500}
			height={250}
			data={filteredData ?? data}
			logScale
			bind:span={() => span2dFromSpans(span.x, frequencySpan),
			(newSpan) => {
				frequencySpan = newSpan.y;
				span = span2dFromSpans(newSpan.x, span.y);
			}}
			bind:cursor
			{playing}
		/>
	</div>
</div>

<style lang="less">
	.stack {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 500px;

		> :not(:last-child) {
			border-bottom: none;
		}
	}

	.audio {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		// border: 1px solid black;

		gap: 6px;
	}
</style>
