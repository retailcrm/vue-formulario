import isScalar from '@/utils/isScalar'
import has from '@/utils/has'

/**
 * A simple (somewhat non-comprehensive) clone function, valid for our use
 * case of needing to unbind reactive watchers.
 */
export default function clone (value: any): any {
    if (typeof value !== 'object') {
        return value
    }

    const copy: any | Record<string, any> = Array.isArray(value) ? [] : {}

    for (const key in value) {
        if (has(value, key)) {
            copy[key] = isScalar(value[key]) ? value[key] : clone(value[key])
        }
    }

    return copy
}
