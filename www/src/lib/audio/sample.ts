
export const DEFAULT_AUDIO_SAMPLERATE = 44100;

export class AudioSample {
    declare data: Float32Array[];
    declare stride: number;
    declare length: number;
    declare samplerate: number;

    constructor(data: Float32Array | Float32Array[] = [], samplerate: number = DEFAULT_AUDIO_SAMPLERATE, stride: number = 128) {
        if (data instanceof Float32Array) {
            data = [data];
        }
        this.data = [];
        this.stride = stride;
        this.length = 0;
        this.samplerate = samplerate;

        let index = 0;
        for (const chunk of data) {
            this.set(chunk, index);
            index += chunk.length;
        }
    }

    getFrame(index: number) {
        const frame = index % this.stride;
        const chunk = (index - frame) / this.stride;
        return this.data[chunk][frame];
    }

    getChunk(chunk: number) {
        return this.data[chunk];
    }

    push(data: Float32Array) {
        this.set(data, this.length);
    }

    set(data: Float32Array, index: number = 0, offset: number = 0, length: number = Infinity) {
        length = Math.min(data.length, length);
        if (index + length > this.length) {
            this.resize(index + length);
        }
        while (offset < length) {
            const frame = index % this.stride;
            const chunk = (index - frame) / this.stride;
            this.data[chunk][frame] = data[offset];
            offset += 1;
            index += 1;
        }
    }

    setFrame(value: number, index: number) {
        if (index >= this.length) {
            this.resize(index + 1);
        }
        const frame = index % this.stride;
        const chunk = (index - frame) / this.stride;
        this.data[chunk][frame] = value;
    }

    frameIndex(index: number) {
        return index % this.stride;
    }

    chunkIndex(index: number) {
        return (index - this.frameIndex(index)) / this.stride
    }

    resize(length: number) {
        while (length > this.data.length * this.stride) {
            this.data.push(new Float32Array(this.stride));
        }
        const chunkLength = this.chunkIndex(length) + 1;
        if (chunkLength < this.data.length) {
            this.data.splice(chunkLength, this.data.length - chunkLength);
        }
        this.length = length;
    }

    shallowCopy(): AudioSample {
        const copied = new AudioSample();
        copied.data = this.data;
        copied.stride = this.stride;
        copied.length = this.length;
        copied.samplerate = this.samplerate;
        return copied;
    }

    duration(): number {
        return this.length / this.samplerate;
    }

    frames(): number {
        return this.length;
    }

    chunks(): number {
        return this.data.length;
    }
}