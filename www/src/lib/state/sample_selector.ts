
import SinWave from '$lib/icons/SinWave.svelte';
import SquareWave from '$lib/icons/SquareWave.svelte';
import SawWave from '$lib/icons/SawWave.svelte';
import TriangleWave from '$lib/icons/TriangleWave.svelte';
import WhiteNoise from '$lib/icons/WhiteNoise.svelte';
import Chirp from '$lib/icons/Chirp.svelte';

export enum SampleType {
    SINE = "Sine",
    SQUARE = "Square",
    SAWTOOTH = "Sawtooth",
    TRIANGLE = "Triangle",
    NOISE = "Noise",
    CHIRP = "Chirp"
};

export const SAMPLE_TYPES = [
    { type: SampleType.SINE, name: 'Sine Wave', icon: SinWave },
    { type: SampleType.SQUARE, name: 'Square Wave', icon: SquareWave },
    { type: SampleType.SAWTOOTH, name: 'Sawtooth Wave', icon: SawWave },
    { type: SampleType.TRIANGLE, name: 'Triangle Wave', icon: TriangleWave },
    { type: SampleType.NOISE, name: 'Noise', icon: WhiteNoise },
    { type: SampleType.CHIRP, name: 'Chirp', icon: Chirp }
];