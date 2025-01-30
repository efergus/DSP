
export type MouseVec = {
    x: number,
    y: number,
}

export type MouseState = {
    pos: MouseVec,
    delta: MouseVec,
    down: boolean,
    edgeDown: boolean,
    edgeUp: boolean,
    click: boolean,
    start: MouseVec | null,
    end: MouseVec | null,
    elapsed: number,
    moved: number,
    target: EventTarget,
    event: MouseEvent
}

export type MouseStateHandler = (state: MouseState) => void;

function mvec(x = 0, y = 0) {
    return { x, y }
}

export function mouseHandler<T = HTMLElement>(handler: MouseStateHandler): (event: MouseEvent) => void {
    const internalState = {
        moved: 0,
        down: false,
        start: mvec(),
        startTime: 0
    }

    const wrapper = (event: MouseEvent) => {
        if (!event.currentTarget) {
            throw new Error("No mouse target!");
        }
        let click = false;
        let down = !!(event.buttons & 1);
        let edgeUp = false;
        let edgeDown = false;
        let pos = mvec(event.clientX, event.clientY);
        let delta = mvec(event.movementX, event.movementY);
        internalState.moved += Math.sqrt(event.movementX ** 2 + event.movementY ** 2);
        let end = null;
        let now = Date.now();
        if (!internalState.down && down) {
            internalState.start = mvec(pos.x, pos.y);
            internalState.startTime = now;
            internalState.moved = 0;
            edgeDown = true;
        }
        if (internalState.down && !down) {
            click = internalState.moved < 12;
            end = mvec(pos.x, pos.y);
            edgeUp = true;
        }
        internalState.down = down;
        let state: MouseState = {
            pos,
            delta,
            down,
            edgeDown,
            edgeUp,
            click,
            start: down ? internalState.start : null,
            end,
            elapsed: down || edgeUp ? (now - internalState.startTime) / 1000 : 0,
            moved: internalState.moved,
            target: event.currentTarget,
            event
        }
        handler(state);
    }
    return wrapper;
}

export function mouse(handler?: MouseStateHandler) {
    if (!handler) {
        return undefined;
    }
    let wrapper = mouseHandler(handler);
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