import isPlainObject from 'is-plain-object'
import { ObjectType } from '@/common.types.ts'
import { has } from '@/libs/utils.ts'

/**
 * Create a new object by copying properties of base and mergeWith.
 * Note: arrays don't overwrite - they push
 *
 * @param {Object} base
 * @param {Object} mergeWith
 * @param {boolean} concatArrays
 */
export default function merge (base: ObjectType, mergeWith: ObjectType, concatArrays: boolean = true) {
    const merged: ObjectType = {}

    for (const key in base) {
        if (has(mergeWith, key)) {
            if (isPlainObject(mergeWith[key]) && isPlainObject(base[key])) {
                merged[key] = merge(base[key], mergeWith[key], concatArrays)
            } else if (concatArrays && Array.isArray(base[key]) && Array.isArray(mergeWith[key])) {
                merged[key] = base[key].concat(mergeWith[key])
            } else {
                merged[key] = mergeWith[key]
            }
        } else {
            merged[key] = base[key]
        }
    }

    for (const prop in mergeWith) {
        if (!has(merged, prop)) {
            merged[prop] = mergeWith[prop]
        }
    }

    return merged
}
