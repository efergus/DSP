import { filterRoots, IirContinuous, IirDigital, s2z_bilinear, s2z_direct, z2s_bilinear, z2s_direct, type Root } from "$lib/dsp/iir";

export class IirState {
    public sPlane: Root[] = $state([]);
    public zPlane: Root[] = $state([]);
    public sGain: number = $state(1);
    public zGain: number = $state(1);

    constructor(
        sPlane: Root[],
        zPlane?: Root[],
        sGain?: number,
        zGain?: number,
    ) {
        this.sPlane = sPlane;
        this.zPlane = zPlane ?? digitalRootsFromRoots(sPlane);
        this.sGain = sGain ?? 1;
        this.zGain = zGain ?? 1;
    }

    setSPlane(value: Root[], gain?: number) {
        const gainChange = (gain ?? this.sGain) / this.sGain;
        this.sPlane = value;
        this.zPlane = digitalRootsFromRoots(value);
        this.sGain = this.sGain * gainChange;
        this.zGain = this.zGain * gainChange;
    }

    setZPlane(value: Root[], gain?: number) {
        const gainChange = (gain ?? this.zGain) / this.zGain;
        this.zPlane = value;
        this.sPlane = rootsFromDigitalRoots(value);
        this.zGain = this.zGain * gainChange;
        this.sGain = this.sGain * gainChange;
    }

    setContinuous(filter: IirContinuous) {
        const roots = filterRoots(filter);
        this.setSPlane(roots, filter.gain);
    }

    setDigital(filter: IirDigital) {
        const roots = filterRoots(filter);
        this.setZPlane(roots, filter.gain);
    }
}

function rootsFromDigitalRoots(digitalRoots: Root[]): Root[] {
    return digitalRoots.map(({ degree, val }) => ({
        degree,
        val: z2s_bilinear(val)
    }));
}

function digitalRootsFromRoots(roots: Root[]): Root[] {
    return roots.map(({ degree, val }) => ({
        degree,
        val: s2z_bilinear(val)
    }));
}