<script lang="ts">
	let width = 400;
	let height = 200;

	let audio_canvas: HTMLCanvasElement;

	// let process_data = (data: any) => {
	// 	console.log(data);
	// };

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

	let listen = (stream: MediaStream) => {
		// const recorder = new MediaRecorder(stream);
		// recorder.ondataavailable = (e) => {
		// 	const data = e.data;
		// 	console.log(data);
		// };
		// recorder.start(60);
		let audio_context = new AudioContext();
		const BUF_SIZE = 1024;

		let source = audio_context.createMediaStreamSource(stream);
		let analyser = audio_context.createAnalyser();
		// analyser.minDecibels = -90;
		// analyser.maxDecibels = -10;
		analyser.fftSize = BUF_SIZE;

		// analyser.smoothingTimeConstant = 0.85;
		// let gainNode = audio_context.createGain();
		// source.connect(gainNode);
		// analyser.connect(sou);
		source.connect(analyser);
		// console.log(stream);
		// let microphone_stream = audio_context.createMediaStreamSource(stream);
		// let script_processor = audio_context.createScriptProcessor(BUF_SIZE, 1, 1);
		// script_processor.onaudioprocess = process_data;
		let buffer = new Float32Array(BUF_SIZE);
		let draw_loop = () => {
			analyser.getFloatTimeDomainData(buffer);
			draw_data(buffer);
			requestAnimationFrame(draw_loop);
		};
		draw_loop();

		// const buffer = audio_context.createBuffer(1, BUF_SIZE, audio_context.sampleRate);
		// const buffer_data = buffer.getChannelData(0);
		// for (let i = 0; i < buffer_data.length; i++) {
		// 	buffer_data[i] = Math.random() * 0.5 - 1;
		// }

		// const source = audio_context.createBufferSource();
		// source.buffer = buffer;
		// source.connect(audio_context.destination);
		// source.start();
	};

	let start_listening = async () => {
		console.log(await navigator.mediaDevices.enumerateDevices());

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
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<button on:click={start_listening}>Start listening</button>
<canvas bind:this={audio_canvas} {width} {height}></canvas>
