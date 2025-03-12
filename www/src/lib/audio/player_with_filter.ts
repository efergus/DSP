import { IirDigital } from "$lib/dsp/iir";
import { DEFAULT_AUDIO_SAMPLERATE, SampleData, type Sample } from "./sample";
import { audioControllerInfo, type AudioControllerMessage } from "./workers/controller/controller";
import { audioIirInfo } from "./workers/iir/iir";

type PlayerAudioState = {
    context: AudioContext;
    controllerNode: AudioWorkletNode;
    filterNode: AudioWorkletNode;
    gain: GainNode;
};

export type PlayerWithFilterOptions = {
    callback?: (data: AudioControllerMessage) => void;
}

type PlayAudioOptions = {
    loop?: boolean;
}

export class PlayerWithFilter {
    declare audio: PlayerAudioState | null;
    declare sample: SampleData;
    declare callback: ((data: AudioControllerMessage) => void) | null;

    constructor(filter?: IirDigital | Float32Array, options: PlayerWithFilterOptions = {}) {
        this.audio = null;
        this.sample = new SampleData();
        this.callback = options?.callback ?? null;
        if (filter) {
            this.setFilter(filter);
        }
    }

    async initializeContext(): Promise<PlayerAudioState> {
        if (this.audio) {
            return this.audio;
        }

        const context = new AudioContext({
            sampleRate: DEFAULT_AUDIO_SAMPLERATE
        });

        await context.audioWorklet.addModule(audioControllerInfo.url);
        const controllerNode = new AudioWorkletNode(context, audioControllerInfo.name);
        await context.audioWorklet.addModule(audioIirInfo.url);
        const filterNode = new AudioWorkletNode(context, audioIirInfo.name);

        const gain = new GainNode(context, { gain: 0.0 });
        controllerNode.connect(filterNode);
        filterNode.connect(gain);
        gain.connect(context.destination);

        this.audio = {
            context,
            controllerNode,
            filterNode,
            gain
        }

        return this.audio;
    }

    async setFilter(filter: IirDigital | Float32Array) {
        let audio = this.audio;
        if (!audio) {
            audio = await this.initializeContext();
        }
        const coeffecients = filter instanceof IirDigital ?
            filter.rawCoefficients() : filter;

        audio.filterNode.port.postMessage({
            filter: coeffecients
        }, [coeffecients.buffer]);
    }

    async play(sample: SampleData, options: PlayAudioOptions = {}) {
        let audio = this.audio;
        if (!audio) {
            audio = await this.initializeContext();
        }
        const { context, gain, controllerNode } = audio;

        const source = new OscillatorNode(context);
        const silentWave = context.createPeriodicWave([0, 0], [0, 0]);
        source.setPeriodicWave(silentWave);
        source.connect(controllerNode);

        gain.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.1);
        const buffer = sample.toFloat32Array();
        controllerNode.port.postMessage({ sample: buffer }, [buffer.buffer])
        controllerNode.port.onmessage = (msg: MessageEvent<AudioControllerMessage>) => {
            this.callback?.(msg.data);
        }
        source.start();
    }
}
