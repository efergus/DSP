
export const DEFAULT_AUDIO_SAMPLERATE = 44100;

export class AudioSample {
    declare data: Float32Array[];
    declare cow: boolean[];
    declare stride: number;
    declare length: number;
    declare samplerate: number;

    constructor(data: Float32Array[] = [], samplerate: number = DEFAULT_AUDIO_SAMPLERATE, stride: number = 128) {
        this.data = [];
        this.cow = [];
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
            this.handleCow(chunk);
            this.data[chunk][frame] = data[offset];
            offset += 1;
            index += 1;
        }
    }

    private handleCow(chunk: number) {
        if (this.cow[chunk]) {
            this.data[chunk] = new Float32Array(this.data[chunk]);
            this.cow[chunk] = false;
        }
    }

    setFrame(value: number, index: number) {
        if (index >= this.length) {
            this.resize(index + 1);
        }
        const frame = index % this.stride;
        const chunk = (index - frame) / this.stride;
        this.handleCow(chunk);
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
            this.cow.push(false);
        }
        const chunkLength = this.chunkIndex(length) + 1;
        if (chunkLength < this.data.length) {
            this.data.splice(chunkLength, this.data.length - chunkLength);
            this.cow.splice(chunkLength, this.data.length - chunkLength);
        }
        this.length = length;
    }

    copy(): AudioSample {
        const copied = new AudioSample();
        copied.data = this.data;
        copied.stride = this.stride;
        copied.length = this.length;

        this.cow = new Array(this.data.length).fill(true);
        copied.cow = this.cow;
        return copied;
    }

    duration(): number {
        return this.length / this.samplerate;
    }
}