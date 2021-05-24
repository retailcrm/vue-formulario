/**
 * @internal
 */
export default class PathRegistry<T> {
    private registry: Map<string, T>

    constructor () {
        this.registry = new Map()
    }

    has (path: string): boolean {
        return this.registry.has(path)
    }

    hasSubset (path: string): boolean {
        for (const itemPath of this.registry.keys()) {
            if (itemPath === path || itemPath.includes(path + '.')) {
                return true
            }
        }

        return false
    }

    get (path: string): T | undefined {
        return this.registry.get(path)
    }

    /**
     * Returns registry subset by given path - field & descendants
     */
    getSubset (path: string): PathRegistry<T> {
        const subset: PathRegistry<T> = new PathRegistry()

        for (const itemPath of this.registry.keys()) {
            if (
                itemPath === path ||
                itemPath.startsWith(path + '.') ||
                itemPath.startsWith(path + '[')
            ) {
                subset.add(itemPath, this.registry.get(itemPath) as T)
            }
        }

        return subset
    }

    add (path: string, item: T): void {
        if (!this.registry.has(path)) {
            this.registry.set(path, item)
        }
    }

    remove (path: string): void {
        this.registry.delete(path)
    }

    paths (): IterableIterator<string> {
        return this.registry.keys()
    }

    forEach (callback: (field: T, path: string) => void): void {
        this.registry.forEach((field, path) => {
            callback(field, path)
        })
    }

    map<U> (mapper: (item: T, path: string) => U): U[] {
        return Array.from(this.registry.keys()).map(path => mapper(this.get(path) as T, path))
    }
}
