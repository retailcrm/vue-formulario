import { isRecordLike, isScalar } from '@/types'

const cloneInstance = <T>(original: T): T => {
    return Object.assign(Object.create(Object.getPrototypeOf(original)), original)
}

/**
 * A simple (somewhat non-comprehensive) clone function, valid for our use
 * case of needing to unbind reactive watchers.
 */
export default function clone<T = unknown> (value: T): T {
    // scalars & immutables
    if (isScalar(value) || value instanceof Blob) {
        return value
    }

    if (value instanceof Date) {
        return new Date(value) as unknown as T
    }

    if (!isRecordLike(value)) {
        return cloneInstance(value)
    }

    if (Array.isArray(value)) {
        return value.slice().map(clone) as unknown as T
    }

    const source: Record<string, unknown> = value as Record<string, unknown>

    return Object.keys(source).reduce((copy, key) => ({
        ...copy,
        [key]: clone(source[key])
    }), {}) as unknown as T
}
