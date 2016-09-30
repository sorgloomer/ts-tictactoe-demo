import {ArrayMapping} from "./arrays";

function cloneArray<T>(arr : T[]) : T[] {
    return Array.prototype.slice.call(arr, 0);
}

function setArrayNew<T>(array:T[], index:number, value:T) : T[] {
    const result = cloneArray(array);
    result[index] = value;
    return result;
}

export function set<T>(array:T[], index:number, value:T) : T[] {
    if (array[index] === value) {
        return array;
    }
    return setArrayNew(array, index, value);
}

export function update<T>(array:T[], index:number, updater:ArrayMapping<T,T>) : T[] {
    return set(array, index, updater(array[index], index, array));
}
