import has from './has'
import { typeOf, TYPE } from '@/types'

export interface EqualPredicate {
    (a: unknown, b: unknown): boolean;
}

export function datesEquals (a: Date, b: Date): boolean {
    return a.getTime() === b.getTime()
}

export function arraysEquals (
    a: unknown[],
    b: unknown[],
    predicate: EqualPredicate
): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0; i < a.length; i++) {
        if (!predicate(a[i], b[i])) {
            return false
        }
    }

    return true
}

export function recordsEquals (
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    predicate: EqualPredicate
): boolean {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false
    }

    for (const prop in a as object) {
        if (!has(b, prop) || !predicate(a[prop], b[prop])) {
            return false
        }
    }

    return true
}

export function strictEquals (a: unknown, b: unknown): boolean {
    return a === b
}

export function equals (a: unknown, b: unknown, predicate: EqualPredicate): boolean {
    const typeOfA = typeOf(a)
    const typeOfB = typeOf(b)

    return typeOfA === typeOfB && (
        (typeOfA === TYPE.ARRAY && arraysEquals(
            a as unknown[],
            b as unknown[],
            predicate
        )) ||
        (typeOfA === TYPE.DATE && datesEquals(a as Date, b as Date)) ||
        (typeOfA === TYPE.RECORD && recordsEquals(
            a as Record<string, unknown>,
            b as Record<string, unknown>,
            predicate
        )) ||
        (typeOfA.includes('InstanceOf') && equals(
            Object.entries(a as object),
            Object.entries(b as object),
            predicate,
        ))
    )
}

export function deepEquals (a: unknown, b: unknown): boolean {
    return a === b || equals(a, b, deepEquals)
}

export function shallowEquals (a: unknown, b: unknown): boolean {
    return a === b || equals(a, b, strictEquals)
}
