<script lang="ts">
	import { SampleData } from '$lib/audio/sample';
	import Upload from '$lib/icons/Upload.svelte';
	import { uniqueId } from '../id';

	const {
		onData,
		rateLimit = 30
	}: {
		onData?: (data: SampleData) => void;
		rateLimit?: number;
	} = $props();

	const fileInputId = uniqueId();
</script>

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
				const data = new SampleData([audio_data.getChannelData(0)]);
				onData?.(data);
			};

			reader.readAsArrayBuffer(file);
		}}
	/>
</label>

<style lang="less">
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
