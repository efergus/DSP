import { s2z_bilinear, z2s_bilinear, type Root } from "$lib/dsp/iir";

export class IirRoots {
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
        val: z2s_bilinear(val)
    }));
}

function digitalRootsFromRoots(roots: Root[]): Root[] {
    return roots.map(({ degree, val }) => ({
        degree,
        val: s2z_bilinear(val)
    }));
}