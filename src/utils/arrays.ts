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

export function minBy<T>(arr: T[], mapping: ArrayMapping<T, string | number>, def: T = null) {
    if (arr.length < 1) {
        return def;
    }
    var bestItem = arr[0];
    var bestValue = mapping(bestItem, 0, arr);
    for (let i = 1; i < arr.length; i++) {
        const currentItem = arr[i];
        const currentValue = mapping(currentItem, i, arr);
        if (currentValue < bestValue) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}

export function maxBy<T>(arr: T[], mapping: ArrayMapping<T, string | number>, def: T = null) {
    if (arr.length < 1) {
        return def;
    }
    var bestItem = arr[0];
    var bestValue = mapping(bestItem, 0, arr);
    for (let i = 1; i < arr.length; i++) {
        const currentItem = arr[i];
        const currentValue = mapping(currentItem, i, arr);
        if (currentValue > bestValue) {
            bestItem = currentItem;
            bestValue = currentValue;
        }
    }
    return bestItem;
}

export function mapToObject<T, U>(arr: T[], mapping: ArrayMapping<T, [string, U]>) : {[key: string]: U} {
    const result = {};
    arr.map(mapping).forEach(([k, v]) => { result[k] = v; });
    return result;
}