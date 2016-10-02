import {int} from "./types";

export type ArrayMapping<T, U> = (value: T, index: int, array: T[]) => U;
export type ArrayPredicate<T> = ArrayMapping<T, boolean>;

export type Mapping<T, U> = (value:T) => U;
export type Predicate<T> = Mapping<T, boolean>;


export function any<T>(arr: T[], pred: ArrayPredicate<T>) : boolean {
    for (let i = 0; i < arr.length; i++) {
        if (pred(arr[i], i, arr)) {
            return true;
        }
    }
    return false;
}

export function all<T>(arr: T[], pred: ArrayPredicate<T>) : boolean {
    return !any(arr, (v,i,a) => !pred(v,i,a));
}

export function repeat<T>(value: T, length: int) : T[] {
    const result = Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

export function everySameOrDefault<T>(arr: T[], def: T) : T {
    const first : T = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] !== first) {
            return def;
        }
    }
    return first;
}

export function mapRange<T>(length: int, factory: (index: int) => T) : T[] {
    const result = Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = factory(i);
    }
    return result;
}


function _selectBy<T, U>(
    arr: T[], mapping: ArrayMapping<T, U>,
    def: T,
    better: (prev:U, current:U) => boolean
) {
    if (arr.length < 1) {
        return def;
    }
    var bestItem : T = arr[0];
    var bestValue : U = mapping(bestItem, 0, arr);
    for (let i = 1; i < arr.length; i++) {
        const currentItem = arr[i];
        const currentValue = mapping(currentItem, i, arr);
        if (better(bestValue, currentValue)) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}

export function minBy<T>(arr: T[], mapping: ArrayMapping<T, string | number>, def: T = null) {
    return _selectBy(arr, mapping, def, (prev, current) => current < prev);
}

export function maxBy<T>(arr: T[], mapping: ArrayMapping<T, string | number>, def: T = null) {
    return _selectBy(arr, mapping, def, (prev, current) => current > prev);
}

export function getRandomItem<T>(arr : T[], def : T = null) : T {
    if (arr.length < 1) {
        return def;
    }
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

export function mapToObject<T, U>(arr: T[], mapping: ArrayMapping<T, [string, U]>) : {[key: string]: U} {
    const result = {};
    arr.map(mapping).forEach(([k, v]) => { result[k] = v; });
    return result;
}