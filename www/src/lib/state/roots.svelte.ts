import { s2z_bilinear, s2z_direct, z2s_bilinear, z2s_direct, type Root } from "$lib/dsp/iir";

export class IirRootsState {
    public sPlane: Root[] = $state([]);
    public zPlane: Root[] = $state([]);

    constructor(
        sPlane: Root[],
        zPlane?: Root[],
    ) {
        this.sPlane = sPlane;
        this.zPlane = zPlane ?? digitalRootsFromRoots(sPlane);
    }

    setSPlane(value: Root[]) {
        this.sPlane = value;
        this.zPlane = digitalRootsFromRoots(value);
    }

    setZPlane(value: Root[]) {
        this.zPlane = value;
        this.sPlane = rootsFromDigitalRoots(value);
    }
}

function rootsFromDigitalRoots(digitalRoots: Root[]): Root[] {
    return digitalRoots.map(({ degree, val }) => ({
        degree,
        val: z2s_direct(val)
    }));
}

function digitalRootsFromRoots(roots: Root[]): Root[] {
    return roots.map(({ degree, val }) => ({
        degree,
        val: s2z_direct(val)
    }));
}