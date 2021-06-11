const registry: Map<string, number> = new Map()

export default (prefix: string): string => {
    const current = registry.get(prefix) || 0
    const next = current + 1

    registry.set(prefix, next)

    return `${prefix}-${next}`
}
