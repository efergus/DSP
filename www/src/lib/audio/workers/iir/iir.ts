
// const url = new URL('./iir_worker.ts', import.meta.url, { type: 'module' });
import workerUrl from './iir_worker.ts?worker&url';

export let audioIirInfo = {
    url: workerUrl,
    name: 'iir_worker'
}