export type RecordKey = string | number
export type RecordLike<T> = T[] | Record<RecordKey, T>

export type Scalar = boolean | number | string | symbol | undefined | null

export function isScalar (value: unknown): boolean {
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'undefined':
            return true
        default:
            return value === null
    }
}
