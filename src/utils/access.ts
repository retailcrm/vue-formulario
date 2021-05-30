import has from './has'
import { isRecordLike, isScalar } from '@/types'

const extractIntOrNaN = (value: string): number => {
    const numeric = parseInt(value)

    return numeric.toString() === value ? numeric : NaN
}

const extractPath = (field: string): string[] => {
    const path = [] as string[]

    field.split('.').forEach(key => {
        if (/(.*)\[(\d+)]$/.test(key)) {
            path.push(...key.substr(0, key.length - 1).split('[').filter(k => k.length))
        } else {
            path.push(key)
        }
    })

    return path
}

const unsetInRecord = (record: Record<string, unknown>, prop: string): Record<string, unknown> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [prop]: _, ...copy } = record

    return copy
}

export function get (state: unknown, fieldOrPath: string|string[]): unknown {
    const path = typeof fieldOrPath === 'string' ? extractPath(fieldOrPath) : fieldOrPath

    if (isScalar(state) || path.length === 0) {
        return undefined
    }

    const key = path.shift() as string
    const index = extractIntOrNaN(key)

    if (!isNaN(index)) {
        if (Array.isArray(state) && index >= 0 && index < state.length) {
            return path.length === 0 ? state[index] : get(state[index], path)
        }

        return undefined
    }

    if (has(state as Record<string, unknown>, key)) {
        const values = state as Record<string, unknown>

        return path.length === 0 ? values[key] : get(values[key], path)
    }

    return undefined
}

export function unset (state: unknown, fieldOrPath: string|string[]): unknown {
    if (!isRecordLike(state)) {
        return state
    }

    const path = typeof fieldOrPath === 'string' ? extractPath(fieldOrPath) : fieldOrPath

    if (path.length === 0) {
        return state
    }

    const key = path.shift() as string
    const index = extractIntOrNaN(key)

    if (!isNaN(index) && Array.isArray(state) && index >= 0 && index < state.length) {
        const values = (state as unknown[]).slice()

        if (path.length === 0) {
            values.splice(index, 1)
        } else {
            values[index] = unset(values[index], path)
        }

        return values
    }

    if (has(state as Record<string, unknown>, key)) {
        const values = state as Record<string, unknown>

        return path.length === 0
            ? unsetInRecord(values, key)
            : { ...values, [key]: unset(values[key], path) }
    }

    return state
}
