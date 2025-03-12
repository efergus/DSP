import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from "./sample";
import { audioControllerInfo } from "./workers/controller/controller";

type PlayerAudioState = {
    context: AudioContext;
    node: AudioWorkletNode;
    gain: GainNode;
};

type PlayAudioOptions = {
    loop?: boolean;
}

export class Player {
    declare audio: PlayerAudioState | null;
    declare sample: SampleData;

    constructor() {
        this.audio = null;
        this.sample = new SampleData();
    }

    async play(sample: SampleData, options: PlayAudioOptions = {}) {
        const context = new AudioContext({
            sampleRate: DEFAULT_AUDIO_SAMPLERATE
        });

        // const buffer = context.createBuffer(1, sample.length, context.sampleRate);
        // const channel = buffer.getChannelData(0);
        // sample.toFloat32Array(channel);

        await context.audioWorklet.addModule(audioControllerInfo.url);
        const node = new AudioWorkletNode(context, audioControllerInfo.name);
        const source = new OscillatorNode(context);
        const silentWave = context.createPeriodicWave([0, 0], [0, 0]);
        source.setPeriodicWave(silentWave);
        // const source = context.createBufferSource();
        // source.buffer = buffer;
        // source.loop = options.loop ?? false;

        const gain = new GainNode(context, { gain: 0.0 });
        // source.connect(gain);
        source.connect(node);
        node.connect(gain);
        gain.connect(context.destination);

        gain.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.1);
        const buffer = sample.toFloat32Array();
        const copy = new Float32Array(buffer);
        node.port.postMessage({ samples: [copy] }, [copy.buffer])
        node.port.onmessage = (msg) => {
            // console.log({ msg: msg.data })
            // source.stop()
            // const silence = new Float32Array(44100 / 2);
            const copy = new Float32Array(buffer);
            node.port.postMessage({ samples: [copy] }, [copy.buffer]);
        }
        source.start();
    }
}
