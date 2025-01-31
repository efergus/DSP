import { v4 } from "uuid";

export function uniqueId(prefix = '') {
    return prefix + v4();
}