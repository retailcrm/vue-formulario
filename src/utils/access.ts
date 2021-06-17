import has from './has'
import { isRecordLike, isScalar } from '@/types'

const extractIntOrNaN = (value: string): number => {
    const numeric = parseInt(value)

    return numeric.toString() === value ? numeric : NaN
}

const extractPath = (raw: string): string[] => {
    const path = [] as string[]

    raw.split('.').forEach(key => {
        if (/(.*)\[(\d+)]$/.test(key)) {
            path.push(...key.substr(0, key.length - 1).split('[').filter(k => k.length))
        } else {
            path.push(key)
        }
    })

    return path
}

export function get (state: unknown, rawOrPath: string|string[], fallback: unknown = undefined): unknown {
    const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath

    if (isScalar(state) || path.length === 0) {
        return fallback
    }

    const key = path.shift() as string
    const index = extractIntOrNaN(key)

    if (!isNaN(index)) {
        if (Array.isArray(state) && index >= 0 && index < state.length) {
            return path.length === 0 ? state[index] : get(state[index], path, fallback)
        }

        return undefined
    }

    if (has(state as Record<string, unknown>, key)) {
        const values = state as Record<string, unknown>

        return path.length === 0 ? values[key] : get(values[key], path, fallback)
    }

    return undefined
}

export function set (state: unknown, rawOrPath: string|string[], value: unknown): unknown {
    const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath

    if (path.length === 0) {
        return value
    }

    const key = path.shift() as string
    const index = extractIntOrNaN(key)

    if (!isRecordLike(state)) {
        return set(!isNaN(index) ? [] : {}, [key, ...path], value)
    }

    if (!isNaN(index) && Array.isArray(state)) {
        const slice = [...state as unknown[]]

        slice[index] = path.length === 0 ? value : set(slice[index], path, value)

        return slice
    }

    const slice = { ...state as Record<string, unknown> }

    slice[key] = path.length === 0 ? value : set(slice[key], path, value)

    return slice
}

const unsetInRecord = (record: Record<string, unknown>, prop: string): Record<string, unknown> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [prop]: _, ...copy } = record

    return copy
}

export function unset (state: unknown, rawOrPath: string|string[]): unknown {
    if (!isRecordLike(state)) {
        return state
    }

    const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath

    if (path.length === 0) {
        return state
    }

    const key = path.shift() as string
    const index = extractIntOrNaN(key)

    if (!isNaN(index) && Array.isArray(state) && index >= 0 && index < state.length) {
        const slice = [...state as unknown[]]

        if (path.length === 0) {
            slice.splice(index, 1)
        } else {
            slice[index] = unset(slice[index], path)
        }

        return slice
    }

    if (has(state as Record<string, unknown>, key)) {
        const slice = { ...state as Record<string, unknown> }

        return path.length === 0
            ? unsetInRecord(slice, key)
            : { ...slice, [key]: unset(slice[key], path) }
    }

    return state
}
