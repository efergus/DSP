export const DEFAULT_AUDIO_SAMPLERATE = 44100;

export type NumArr = number[] | Float32Array | Float64Array;

export interface Sample {
    length: number;

    get(index: number): number;
    frames(): number;
}

export interface SampleWithSamplerate extends Sample {
    samplerate: number;

    duration(): number;
}

export class SampleData implements SampleWithSamplerate {
    declare data: Float32Array[];
    declare stride: number;
    declare length: number;
    declare samplerate: number;

    constructor(data: Float32Array | Float32Array[] | Sample = [], samplerate: number = DEFAULT_AUDIO_SAMPLERATE, stride: number = 128) {
        if (data instanceof Float32Array) {
            data = [data];
        }
        this.data = [];
        this.stride = stride;
        this.length = 0;
        this.samplerate = samplerate;

        if (Array.isArray(data)) {
            let index = 0;
            for (const chunk of data) {
                this.setRange(chunk, index);
                index += chunk.length;
            }
        }
        else {
            this.setRange(data);
        }
    }

    get(index: number) {
        const frame = index % this.stride;
        const chunk = (index - frame) / this.stride;
        return this.data[chunk][frame];
    }

    slice(start: number = 0, end?: number) {
        end = end ?? this.length;
        const length = end < 0 ? this.length - start + end : end - start
        return new SampleSlice(this, start, length);
    }

    getChunk(chunk: number) {
        return this.data[chunk];
    }

    push(data: Float32Array) {
        this.setRange(data, this.length);
    }

    set(value: number, index: number) {
        if (index >= this.length) {
            this.resize(index + 1);
        }
        const frame = index % this.stride;
        const chunk = (index - frame) / this.stride;
        this.data[chunk][frame] = value;
    }

    setRange(data: Float32Array | Sample, index: number = 0, offset: number = 0, length: number = Infinity) {
        const getData = data instanceof Float32Array ? (index: number) => data[index] : (index: number) => data.get(index);
        length = Math.min(data.length, length);
        if (index + length > this.length) {
            this.resize(index + length);
        }
        while (offset < length) {
            const frame = index % this.stride;
            const chunk = (index - frame) / this.stride;
            this.data[chunk][frame] = getData(offset);
            offset += 1;
            index += 1;
        }
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

export class SampleSlice implements SampleWithSamplerate {
    declare ref: SampleData;
    declare start: number;
    declare length: number;

    get samplerate() {
        return this.ref.samplerate;
    }

    constructor(ref: SampleData, start: number, length: number) {
        this.ref = ref;
        this.start = start;
        this.length = length;
    }

    get(index: number) {
        return this.ref.get(this.start + index);
    }

    set(value: number, index: number) {
        this.ref.set(value, index + this.start);
    }

    duration(): number {
        return this.length / this.ref.samplerate;
    }

    frames(): number {
        return this.length;
    }
}

export class SampleView implements Sample {
    declare getter: (index: number) => number;
    declare length: number;
    declare samplerate: number;

    constructor(sample: Sample | NumArr | null, length?: number) {
        if (!sample) {
            this.getter = () => 0;
            this.length = 0;
        }
        else if (sample instanceof Float32Array || sample instanceof Float64Array || Array.isArray(sample)) {
            this.getter = (index: number) => sample[index];
            this.length = length ?? sample.length;
        }
        else {
            this.getter = sample.get.bind(sample);
            this.length = length ?? sample.frames();
        }
    }

    get(index: number) {
        return this.getter(index);
    }

    frames(): number {
        return this.length;
    }
}
