import type { Span2D } from "$lib/math/span";

export type LongCursorPathProps = {
    span: Span2D;
    width?: number;
    size?: number;
    stroke?: number;
    color?: string;
    x?: number;
}