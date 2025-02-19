<script lang="ts">
	import { audioTapInfo } from '$lib/audio/processor';
	import Circle from '$lib/icons/Circle.svelte';
	import Square from '$lib/icons/Square.svelte';

	export type AudioChunk = {
		index: number;
		data: Float32Array;
	};

	const {
		onChunk
	}: {
		onChunk?: (chunk: AudioChunk) => void;
	} = $props();

	let audio: {
		context: AudioContext;
		stream: MediaStream;
		source: MediaStreamAudioSourceNode;
		node: AudioWorkletNode;
		gain: GainNode;
	} | null = $state(null);
	let recording = $state(false);
	let chunkIndex = 0;

	const record = async () => {
		if (!audio) {
			const stream = await navigator.mediaDevices.getUserMedia({
				// MediaTrackConstraints
				audio: {
					autoGainControl: false,
					echoCancellation: false,
					noiseSuppression: false,
					channelCount: {
						min: 1,
						max: 2
					}
				}
			});
			const context = new AudioContext();
			const source = context.createMediaStreamSource(stream);

			await context.audioWorklet.addModule(audioTapInfo.url);
			const node = new AudioWorkletNode(context, audioTapInfo.name, {
				processorOptions: {
					silent: false
				}
			});
			const gain = new GainNode(context, { gain: 0.0 });
			source.connect(node);
			node.connect(gain);
			gain.connect(context.destination);

			node.port.onmessage = (event) => {
				if (recording) {
					onChunk?.({
						index: chunkIndex,
						// TODO handle multiple channels?
						data: event.data[0]
					});
					chunkIndex += 1;
				}
			};
			audio = {
				context,
				stream,
				source,
				node,
				gain
			};
		}

		recording = !recording;

		if (recording) {
			chunkIndex = 0;
			audio.gain.gain.linearRampToValueAtTime(1.0, audio.context.currentTime + 0.1);
		} else {
			audio.gain.gain.linearRampToValueAtTime(0.0, audio.context.currentTime + 0.1);
			audio.stream.getAudioTracks().forEach((track) => {
				track.stop();
				audio?.context.close();
				audio = null;
			});
		}
	};
</script>

<button onclick={record}>
	{#if recording}
		<Square fill="black" />
	{:else}
		<Circle stroke="red" fill="red" />
	{/if}
</button>
