import has from '@/utils/has'
import { RecordLike, Scalar, isScalar } from '@/types'

type Cloneable = Scalar|Date|RecordLike<unknown>

export const cloneInstance = <T>(original: T): T => {
    return Object.assign(Object.create(Object.getPrototypeOf(original)), original)
}

/**
 * A simple (somewhat non-comprehensive) clone function, valid for our use
 * case of needing to unbind reactive watchers.
 */
export default function clone (value: Cloneable): Cloneable {
    if (isScalar(value)) {
        return value as Scalar
    }

    if (value instanceof Date) {
        return new Date(value)
    }

    const source: RecordLike<unknown> = value as RecordLike<unknown>
    const copy: RecordLike<unknown> = Array.isArray(source) ? [] : {}

    for (const key in source) {
        if (has(source, key)) {
            if (isScalar(source[key])) {
                copy[key] = source[key]
            } else if (source[key] instanceof Date) {
                copy[key] = new Date(source[key] as Date)
            } else {
                copy[key] = clone(source[key] as Cloneable)
            }
        }
    }

    return copy
}
