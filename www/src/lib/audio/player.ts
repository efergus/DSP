import { audioTapInfo } from "./processor";
import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from "./sample";

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

        const buffer = context.createBuffer(1, sample.length, context.sampleRate);
        const channel = buffer.getChannelData(0);
        sample.toFloat32Array(channel);

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = options.loop ?? false;

        const gain = new GainNode(context, { gain: 0.0 });
        source.connect(gain);
        gain.connect(context.destination);

        gain.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.1);
        source.start();
    }
}
