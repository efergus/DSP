<script lang="ts">
	import { processor } from '$lib/audio/processor';

	let width = 400;
	let height = 200;

	let audio_canvas: HTMLCanvasElement;
	let audio_blob: Blob | null = null;

	let draw_data = (data: Float32Array) => {
		const context = audio_canvas.getContext('2d');
		if (!context) {
			throw new Error('No context!');
		}

		context.fillStyle = 'rgb(200 200 200)';
		context.fillRect(0, 0, width, height);

		context.lineWidth = 2;
		context.strokeStyle = 'rgb(0 0 0)';

		const dx = width / data.length;
		let x = 0;
		let y = height / 2;

		context.beginPath();
		context.moveTo(x, y);
		for (let i = 1; i < data.length; i++) {
			let dy = -(data[i] * height) / 2;
			context.lineTo(x + i * dx, y + dy);
		}
		context.stroke();
	};

	let listen = async (stream: MediaStream) => {
		let audio_context = new AudioContext();
		const BUF_SIZE = 1024;

		let source = audio_context.createMediaStreamSource(stream);
		let analyser = audio_context.createAnalyser();
		let delay = audio_context.createDelay(0.5);
		let oscillator = new OscillatorNode(audio_context, {
			frequency: 440,
			type: 'sine'
		});
		let gain1 = new GainNode(audio_context, { gain: 0.9 });
		let gain2 = new GainNode(audio_context, { gain: 0.0 });
		// source.connect(delay);
		analyser.fftSize = BUF_SIZE;
		source.connect(analyser);

		let buffer = new Float32Array(BUF_SIZE);
		let draw_loop = () => {
			analyser.getFloatTimeDomainData(buffer);
			draw_data(buffer);
			requestAnimationFrame(draw_loop);
		};
		draw_loop();

		await audio_context.audioWorklet.addModule(processor.url);

		let node = new AudioWorkletNode(audio_context, processor.name, {});
		source.connect(node);
		node.connect(delay);
		delay.connect(gain1);
		// gain1.connect(node);
		gain1.connect(audio_context.destination);
		oscillator.connect(gain2);
		gain2.connect(audio_context.destination);
		oscillator.start();
	};

	let start_listening = async () => {
		console.log(await navigator.mediaDevices.enumerateDevices());
		console.log(import.meta.url);

		await navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				console.log({ stream });
				listen(stream);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	let record = async () => {
		await navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				let recorder = new MediaRecorder(stream);
				recorder.start();
				recorder.ondataavailable = (event) => {
					audio_blob = event.data;
				};
				setTimeout(() => {
					recorder.stop();
				}, 5000);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	let play = async () => {
		if (!audio_blob) {
			throw new Error('No audio!');
		}
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		let audio_context = new AudioContext();
		const BUF_SIZE = 1024;

		let data = await audio_context.decodeAudioData(await audio_blob.arrayBuffer());
		const source = new AudioBufferSourceNode(audio_context, { buffer: data });
		console.log({ data });
		source.connect(audio_context.destination);
		source.start();
	};

	$: blob_ready = !!audio_blob;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<button on:click={start_listening}>Start listening</button>
<button on:click={record}>Record</button>
<button on:click={play} disabled={!blob_ready}>Play</button>
<canvas bind:this={audio_canvas} {width} {height}></canvas>
