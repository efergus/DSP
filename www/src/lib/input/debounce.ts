import { onMount } from "svelte";

export const debounce = (callback: (...args: any[]) => void, wait: number = 100) => {
    let timeoutId: number | undefined;
    return (...args: any[]) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback(...args);
        }, wait);
    };
}

export const throttle = (callback: (...args: any[]) => void, wait: number = 100) => {
    let lastTime = 0;
    let timeoutId: number | undefined;
    return (...args: any[]) => {
        window.clearTimeout(timeoutId);
        const now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            callback(...args);
        }
        else {
            timeoutId = window.setTimeout(() => {
                lastTime = Date.now();
                callback(...args);
            }, wait - (now - lastTime));
        }
    };
}

export const animate = (callback: (time: number) => void | false) => {
    const loop = (time: number) => {
        const value = callback(time);
        if (value !== false) {
            requestAnimationFrame(loop);
        }
    };
    requestAnimationFrame(loop);
}

export const onMountAnimate = (callback: (time: number) => void | false) => {
    onMount(() => animate(callback));
}