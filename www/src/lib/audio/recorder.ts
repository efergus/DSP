import { SampleData, SampleSlice, type Sample } from "./sample";
import { audioTapInfo } from "./workers/tap/tap";


export type RecorderCallbackData = {
    sample: SampleData;
    data: Float32Array;
};

export type RecorderCallback = (data: RecorderCallbackData) => void;

export type RecorderStartParams = {
    samplerate?: number;
    // callbackrate?: number;
    callback?: RecorderCallback;
}

type RecorderAudioState = {
    context: AudioContext;
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
    node: AudioWorkletNode;
    gain: GainNode;
};

export class Recorder {
    declare sample: SampleData;
    declare audio: RecorderAudioState | null;
    // declare callback: RecorderCallback | null;

    constructor() {
        this.sample = new SampleData();
        this.audio = null;
        // this.callback = null
    }

    async startAsync(params: RecorderStartParams) {
        if (this.audio) {
            return;
        }
        this.sample = new SampleData();

        if (params.callback) {
            params.callback({
                sample: this.sample,
                data: new Float32Array(0),
            })
        }

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
            if (!this.audio) {
                node.port.close();
                return;
            }
            this.sample.push(event.data[0]);
            if (params.callback) {
                params.callback({
                    sample: this.sample,
                    data: event.data[0]
                })
            }
        };
        this.audio = {
            context,
            stream,
            source,
            node,
            gain
        };

        this.audio.gain.gain.linearRampToValueAtTime(1.0, this.audio.context.currentTime + 0.1);

    }

    start(params: RecorderStartParams = {}) {
        this.startAsync(params);
    }

    stop() {
        if (!this.audio) {
            return;
        }
        this.audio.stream.getAudioTracks().forEach((track) => {
            track.stop();
            this.audio?.context.close();
        });
        this.audio = null;
    }

    getSample() {
        return this.sample;
    }

    setSample(sample: Sample | Float32Array) {
        this.sample = new SampleData(sample);
    }
}