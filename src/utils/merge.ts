import isPlainObject from 'is-plain-object'
import has from '@/utils/has.ts'

/**
 * Create a new object by copying properties of base and mergeWith.
 * Note: arrays don't overwrite - they push
 *
 * @param {Object} a
 * @param {Object} b
 * @param {boolean} concatArrays
 */
export default function merge (
    a: Record<string, any>,
    b: Record<string, any>,
    concatArrays = true
): Record<string, any> {
    const merged: Record<string, any> = {}

    for (const key in a) {
        if (has(b, key)) {
            if (isPlainObject(b[key]) && isPlainObject(a[key])) {
                merged[key] = merge(a[key], b[key], concatArrays)
            } else if (concatArrays && Array.isArray(a[key]) && Array.isArray(b[key])) {
                merged[key] = a[key].concat(b[key])
            } else {
                merged[key] = b[key]
            }
        } else {
            merged[key] = a[key]
        }
    }

    for (const prop in b) {
        if (!has(merged, prop)) {
            merged[prop] = b[prop]
        }
    }

    return merged
}
