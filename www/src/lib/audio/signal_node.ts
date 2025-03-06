import type { IirDigital } from "$lib/dsp/iir";

export interface SignalNode {
    connect(child: SignalNode): void;
    disconnect(child: SignalNode): void;
    process(input: Float32Array): Float32Array;
}

export class SignalNodeBase implements SignalNode {
    private children: SignalNode[] = [];

    connect(child: SignalNode): void {
        this.children.push(child);
    }

    disconnect(child: SignalNode): void {
        this.children = this.children.filter((c) => c !== child);
    }

    process(input: Float32Array): Float32Array {
        return input;
    }
}

export class SignalNodeFilter extends SignalNodeBase {
    private filter: IirDigital;
    private prevInput: Float32Array;
    private prevOutput: Float32Array;

    constructor(filter: IirDigital) {
        super();
        this.filter = filter;
        this.prevInput = new Float32Array(0);
        this.prevOutput = new Float32Array(0);
    }

    process(input: Float32Array): Float32Array {
        const output = this.filter.apply(input, this.prevInput, this.prevOutput);
        this.prevInput = input;
        this.prevOutput = output;
        return output;
    }
}
