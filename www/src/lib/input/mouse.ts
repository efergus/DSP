import { point, type Point } from "$lib/math/point";
import { span2d, type Span2D } from "$lib/math/span";

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
    leaveEvent: boolean,
    target: EventTarget,
    event: MouseEvent
}

export type MouseOptions = {
    remap?: Span2D | ((point: Point) => Point),
    state?: SavedMouseState,
    target?: HTMLElement,
    clickMovementThreshold?: number,
    clickDuration?: number
}

export type MouseStateHandler = (state: MouseState) => void;

export function mouseHandler(handler: MouseStateHandler, options: MouseOptions = {}): (event: MouseEvent, leaveEvent?: boolean) => void {
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
    let remapFn;
    if (remap) {
        if (typeof remap === 'function') {
            remapFn = remap;
        } else {
            remapFn = (point: Point, sourceRect: Span2D) => sourceRect.remap(point, remap)
        }
    }
    else {
        remapFn = (point: Point) => point;
    }

    const wrapper = (event: MouseEvent, leaveEvent?: boolean) => {
        const target = options.target ?? event.currentTarget as HTMLElement;
        if (!target) {
            throw new Error("No mouse target!");
        }
        const rect = target?.getBoundingClientRect();
        if (!rect) {
            throw new Error("Could not get target rect!");
        }
        const { clickDuration = 400 } = options;
        let click = false;
        let down = !!(event.buttons & 1);
        let edgeUp = false;
        let edgeDown = false;
        let globalPos = point(event.clientX, event.clientY);
        let pixelPos = point(event.clientX - rect.x, event.clientY - rect.y);
        let pos = pixelPos;
        let pixelDelta = point(event.movementX, event.movementY);
        let delta = pixelDelta;
        if (remapFn) {
            const sourceRect = span2d(0, rect.width, 0, rect.height);
            pos = remapFn(pixelPos, sourceRect);
            delta = remapFn(pixelDelta, sourceRect);
        }
        internalState.moved += Math.sqrt(event.movementX ** 2 + event.movementY ** 2);
        let now = Date.now();
        if (!internalState.down && down) {
            internalState.start = pos.copy();
            internalState.start = pixelPos.copy();
            internalState.start = globalPos.copy();
            internalState.startTime = now;
            internalState.moved = 0;
            edgeDown = true;
        }
        if (internalState.down && !down) {
            click = internalState.moved < clickMovementThreshold && now - internalState.startTime < clickDuration;
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
            event,
            leaveEvent: leaveEvent ?? false
        }
        handler(state);
    }
    return wrapper;
}

export function mouseDispatch(handler?: MouseStateHandler, options: MouseOptions = {}) {
    if (!handler) {
        return undefined;
    }
    let wrapper = mouseHandler(handler, options);
    return {
        onmousedown: wrapper,
        onmouseup: wrapper,
        onmouseenter: wrapper,
        onmouseleave: (event: MouseEvent) => wrapper(event, true),
        onmousemove: wrapper,
        // todo: investigate touching
        // ontouchstart: wrapper,
        // ontouchend: wrapper,
        // ontouchmove: wrapper,
        // ontouchcancel: wrapper
    }
}