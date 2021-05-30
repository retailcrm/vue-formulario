import has from '@/utils/has'
import {
    RecordLike,
    Scalar,
    isRecordLike,
    isScalar,
} from '@/types'

const cloneInstance = <T>(original: T): T => {
    return Object.assign(Object.create(Object.getPrototypeOf(original)), original)
}

/**
 * A simple (somewhat non-comprehensive) clone function, valid for our use
 * case of needing to unbind reactive watchers.
 */
export default function clone (value: unknown): unknown {
    if (isScalar(value)) {
        return value as Scalar
    }

    if (value instanceof Date) {
        return new Date(value)
    }

    if (!isRecordLike(value)) {
        return cloneInstance(value)
    }

    const source: RecordLike<unknown> = value as RecordLike<unknown>
    const copy: RecordLike<unknown> = Array.isArray(source) ? [] : {}

    for (const key in source) {
        if (has(source, key)) {
            copy[key] = clone(source[key])
        }
    }

    return copy
}
