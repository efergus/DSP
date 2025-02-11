// audio-worklet.d.ts

declare interface AudioWorkletProcessorOptions {
    numberOfInputs?: number;
    numberOfOutputs?: number;
    outputChannelCount?: number[];
    parameterData?: Record<string, number>;
    processorOptions?: any; // Custom user-defined options
}

declare abstract class AudioWorkletProcessor {
    readonly port: MessagePort;

    constructor(options?: AudioWorkletProcessorOptions);

    /**
     * Process method called for every render quantum (usually 128 samples).
     * @param inputs Array of input channels.
     * @param outputs Array of output channels.
     * @param parameters Object containing AudioParam data.
     */
    abstract process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

// Register the processor with the given name.
declare function registerProcessor(
    name: string,
    processorCtor: typeof AudioWorkletProcessor
): void;
