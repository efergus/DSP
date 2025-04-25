<script lang="ts">
	import { PlayerWithFilter } from '$lib/audio/player_with_filter';
	import { SampleData } from '$lib/audio/sample';
	import { type IirDigital } from '$lib/dsp/iir';
	import Circle from '$lib/icons/Circle.svelte';
	import Pause from '$lib/icons/Pause.svelte';
	import PlayPixel from '$lib/icons/PlayPixel.svelte';
	import Button from '../input/Button.svelte';

	let {
		data,
		filter,
		playing = $bindable(false),
		frame = $bindable(0),
		onFrame
	}: {
		data: SampleData;
		filter?: IirDigital;
		playing?: boolean;
		frame?: number;
		onFrame?: (frame: number) => void;
	} = $props();
	let frameState = $state(0);
	let filterChanged = $state(0);
	let player: PlayerWithFilter = $state(
		new PlayerWithFilter(filter, {
			callback: ({ remaining }) => {
				if (!remaining) {
					const now = Date.now();
					if (now - filterChanged < 3000) {
						setTimeout(() => player.play(data), 250);
					} else {
						playing = false;
						frameState = 0;
						frame = 0;
						return;
					}
				}
				frameState = data.length - remaining;
				frame = frameState;
				onFrame?.(frameState);
			}
		})
	);

	$effect(() => {
		if (filter) {
			player.setFilter(filter);
			filterChanged = Date.now();
		}
	});

	$effect(() => {
		if (data) {
			player.setSample(data);
		}
	});

	$effect(() => {
		if (playing) {
			player.resume();
		} else {
			player.pause();
		}
	});

	$effect(() => {
		if (frame !== frameState) {
			player.seek(frame);
			frameState = frame;
		}
	});
</script>

<Button
	slim
	onclick={() => {
		if (playing) {
			player.pause();
		} else {
			if (frameState > 0) {
				player.resume();
			} else {
				player.play(data);
			}
		}
		playing = !playing;
	}}
>
	{#if playing}
		<Pause />
	{:else}
		<PlayPixel />
	{/if}
</Button>
