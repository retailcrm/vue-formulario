export function equalsDates (a: Date, b: Date): boolean {
    return a.getTime() === b.getTime()
}

export function shallowEqualsRecords (
    a: Record<string, unknown>,
    b: Record<string, unknown>
): boolean {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)

    if (aKeys.length !== bKeys.length) {
        return false
    }

    if (aKeys.length === 0) {
        return a === b
    }

    return aKeys.reduce((equals: boolean, key: string): boolean => {
        return equals && a[key] === b[key]
    }, true)
}

export default function shallowEquals (a: unknown, b: unknown): boolean {
    if (a === b) {
        return true
    }

    if (!a || !b) {
        return false
    }

    if (a instanceof Date && b instanceof Date) {
        return equalsDates(a, b)
    }

    return shallowEqualsRecords(
        a as Record<string, unknown>,
        b as Record<string, unknown>
    )
}
