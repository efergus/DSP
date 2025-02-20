import { point, pointCopy, type Point, type Span2D } from "$lib/geometry/geometry";

export type SavedMouseState = {
    down: boolean,
    moved: number,
    start: Point | null,
    pixelStart: Point | null,
    globalStart: Point | null,
    startTime: number
}

export type MouseState = {
    pos: Point,
    pixelPos: Point,
    globalPos: Point,
    start: Point | null,
    pixelStart: Point | null,
    globalStart: Point | null,
    delta: Point,
    pixelDelta: Point,
    down: boolean,
    edgeDown: boolean,
    edgeUp: boolean,
    click: boolean,
    elapsed: number,
    moved: number,
    target: EventTarget,
    event: MouseEvent
}

export type MouseOptions = {
    remap?: Span2D,
    state?: SavedMouseState,
    target?: HTMLElement,
    clickMovementThreshold?: number
}

export type MouseStateHandler = (state: MouseState) => void;

export function mouseHandler(handler: MouseStateHandler, options: MouseOptions = {}): (event: MouseEvent) => void {
    const internalState: SavedMouseState = options?.state ?? {
        moved: 0,
        down: false,
        start: point(),
        pixelStart: point(),
        globalStart: point(),
        startTime: 0
    };

    const { remap, clickMovementThreshold = 12 } = options;

    // y axis is flipped so top of screen is positive y
    const remapRect = remap ? {
        x: remap.x.min,
        y: remap.y.max,
        w: remap.x.max - remap.x.min,
        h: remap.y.min - remap.y.max
    } : null;

    const wrapper = (event: MouseEvent) => {
        const target = options.target ?? event.currentTarget as HTMLElement;
        if (!target) {
            throw new Error("No mouse target!");
        }
        const rect = target?.getBoundingClientRect();
        if (!rect) {
            throw new Error("Could not get target rect!");
        }
        let click = false;
        let down = !!(event.buttons & 1);
        let edgeUp = false;
        let edgeDown = false;
        let globalPos = point(event.clientX, event.clientY);
        let pixelPos = point(event.clientX - rect.x, event.clientY - rect.y);
        let pos = pixelPos;
        let pixelDelta = point(event.movementX, event.movementY);
        let delta = pixelDelta;
        if (remapRect) {
            pos = point(pixelPos.x * remapRect.w / rect.width + remapRect.x, pixelPos.y * remapRect.h / rect.height + remapRect.y);
            delta = point(pixelDelta.x * remapRect.w / rect.width, pixelDelta.y * remapRect.h / rect.height);
        }
        internalState.moved += Math.sqrt(event.movementX ** 2 + event.movementY ** 2);
        let now = Date.now();
        if (!internalState.down && down) {
            internalState.start = pointCopy(pos);
            internalState.start = pointCopy(pixelPos);
            internalState.start = pointCopy(globalPos);
            internalState.startTime = now;
            internalState.moved = 0;
            edgeDown = true;
        }
        if (internalState.down && !down) {
            click = internalState.moved < clickMovementThreshold;
            edgeUp = true;
        }
        if (!internalState.down && !down) {
            internalState.start = null;
            internalState.pixelStart = null;
            internalState.globalStart = null;
        }
        internalState.down = down;
        let state: MouseState = {
            pos,
            delta,
            pixelPos,
            pixelDelta,
            globalPos,
            down,
            edgeDown,
            edgeUp,
            click,
            start: internalState.start,
            pixelStart: internalState.pixelStart,
            globalStart: internalState.globalStart,
            elapsed: down || edgeUp ? (now - internalState.startTime) / 1000 : 0,
            moved: internalState.moved,
            target,
            event
        }
        handler(state);
    }
    return wrapper;
}

export function mouse(handler?: MouseStateHandler, options: MouseOptions = {}) {
    if (!handler) {
        return undefined;
    }
    let wrapper = mouseHandler(handler, options);
    return {
        onmousedown: wrapper,
        onmouseup: wrapper,
        onmouseenter: wrapper,
        onmouseleave: wrapper,
        onmousemove: wrapper,
        // todo: investigate touching
        // ontouchstart: wrapper,
        // ontouchend: wrapper,
        // ontouchmove: wrapper,
        // ontouchcancel: wrapper
    }
}