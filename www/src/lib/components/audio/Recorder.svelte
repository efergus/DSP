<script lang="ts">
	import { audioTapInfo } from '$lib/audio/processor';
	import { AudioSample } from '$lib/audio/sample';
	import Circle from '$lib/icons/Circle.svelte';
	import Square from '$lib/icons/Square.svelte';
	import Upload from '$lib/icons/Upload.svelte';
	import { uniqueId } from '../id';

	export type AudioChunk = {
		index: number;
		data: Float32Array;
	};

	const {
		onData
	}: {
		onData?: (data: AudioSample) => void;
	} = $props();

	const fileInputId = uniqueId();

	let data = $state(new AudioSample());

	let audio: {
		context: AudioContext;
		stream: MediaStream;
		source: MediaStreamAudioSourceNode;
		node: AudioWorkletNode;
		gain: GainNode;
	} | null = $state(null);
	let recording = $state(false);
	let chunkIndex = $state(0);

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
					if (chunkIndex === 0) {
						data = new AudioSample();
						length = 0;
					}
					data = data.shallowCopy();
					data.push(event.data[0]);
					onData?.(data);
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

<div>
	<label for={fileInputId}>
		<Upload />
		<input
			type="file"
			id={fileInputId}
			onchange={(e) => {
				if (!e.target) {
					return;
				}
				let files = (e.target as HTMLInputElement).files;
				if (!files?.length) {
					throw new Error('No files');
				}
				let file = files[0];

				let reader = new FileReader();
				reader.onload = async (e) => {
					if (!e.target) {
						return;
					}
					const content = e.target.result;
					let audio_context = new AudioContext();
					const audio_data = await audio_context.decodeAudioData(content as ArrayBuffer);
					data = new AudioSample([audio_data.getChannelData(0)]);
					onData?.(data);
				};

				reader.readAsArrayBuffer(file);
			}}
		/>
	</label>
	<button onclick={record}>
		{#if recording}
			<Square fill="black" />
		{:else}
			<Circle stroke="red" fill="red" />
		{/if}
	</button>
</div>

<style lang="less">
	div {
		display: flex;
		gap: 6px;
	}

	label {
		display: block;
		padding: 6px;
		border-radius: 6px;
		background-color: rgba(0, 0, 0, 0.2);
		width: max-content;

		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
		}
	}

	input {
		display: none;
	}
</style>
