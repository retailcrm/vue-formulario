export function shallowEqualObjects (objA: Record<string, any>, objB: Record<string, any>): boolean {
    if (objA === objB) {
        return true
    }

    if (!objA || !objB) {
        return false
    }

    const aKeys = Object.keys(objA)
    const bKeys = Object.keys(objB)

    if (bKeys.length !== aKeys.length) {
        return false
    }

    if (objA instanceof Date && objB instanceof Date) {
        return objA.getTime() === objB.getTime()
    }

    if (aKeys.length === 0) {
        return objA === objB
    }

    for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i]

        if (objA[key] !== objB[key]) {
            return false
        }
    }
    return true
}

/**
 * Given a string, convert snake_case to camelCase
 * @param {String} string
 */
export function snakeToCamel (string: string | any): string | any {
    if (typeof string === 'string') {
        return string.replace(/([_][a-z0-9])/ig, ($1) => {
            if (string.indexOf($1) !== 0 && string[string.indexOf($1) - 1] !== '_') {
                return $1.toUpperCase().replace('_', '')
            }
            return $1
        })
    }
    return string
}

/**
 * Converts to array.
 * If given parameter is not string, object ot array, result will be an empty array.
 * @param {*} item
 */
export function arrayify (item: any): any[] {
    if (!item) {
        return []
    }
    if (typeof item === 'string') {
        return [item]
    }
    if (Array.isArray(item)) {
        return item
    }
    if (typeof item === 'object') {
        return Object.values(item)
    }
    return []
}

/**
 * Escape a string for use in regular expressions.
 */
export function escapeRegExp (string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

/**
 * Given a string format (date) return a regex to match against.
 */
export function regexForFormat (format: string): RegExp {
    const escaped = `^${escapeRegExp(format)}$`
    const formats: Record<string, string> = {
        MM: '(0[1-9]|1[012])',
        M: '([1-9]|1[012])',
        DD: '([012][1-9]|3[01])',
        D: '([012]?[1-9]|3[01])',
        YYYY: '\\d{4}',
        YY: '\\d{2}'
    }

    return new RegExp(Object.keys(formats).reduce((regex, format) => {
        return regex.replace(format, formats[format])
    }, escaped))
}

/**
 * Check if
 * @param {*} data
 */
export function isScalar (data: any): boolean {
    switch (typeof data) {
        case 'symbol':
        case 'number':
        case 'string':
        case 'boolean':
        case 'undefined':
            return true
        default:
            return data === null
    }
}

/**
 * A simple (somewhat non-comprehensive) cloneDeep function, valid for our use
 * case of needing to unbind reactive watchers.
 */
export function cloneDeep (value: any): any {
    if (typeof value !== 'object') {
        return value
    }

    const copy: any | Record<string, any> = Array.isArray(value) ? [] : {}

    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            if (isScalar(value[key])) {
                copy[key] = value[key]
            } else {
                copy[key] = cloneDeep(value[key])
            }
        }
    }

    return copy
}

/**
 * Shorthand for Object.prototype.hasOwnProperty.call (space saving)
 */
export function has (ctx: Record<string, any>, prop: string): boolean {
    return Object.prototype.hasOwnProperty.call(ctx, prop)
}

export function getNested (obj: Record<string, any>, field: string): any {
    const fieldParts = field.split('.')

    let result: Record<string, any> = obj

    for (const key in fieldParts) {
        const matches = fieldParts[key].match(/(.+)\[(\d+)\]$/)
        if (result === undefined) {
            return null
        }
        if (matches) {
            result = result[matches[1]]

            if (result === undefined) {
                return null
            }
            result = result[matches[2]]
        } else {
            result = result[fieldParts[key]]
        }
    }
    return result
}

export function setNested (obj: Record<string, any>, field: string, value: any): void {
    const fieldParts = field.split('.')

    let subProxy: Record<string, any> = obj
    for (let i = 0; i < fieldParts.length; i++) {
        const fieldPart = fieldParts[i]
        const matches = fieldPart.match(/(.+)\[(\d+)\]$/)

        if (matches) {
            if (subProxy[matches[1]] === undefined) {
                subProxy[matches[1]] = []
            }
            subProxy = subProxy[matches[1]]

            if (i === fieldParts.length - 1) {
                subProxy[matches[2]] = value
                break
            } else {
                subProxy = subProxy[matches[2]]
            }
        } else {
            if (i === fieldParts.length - 1) {
                subProxy[fieldPart] = value
                break
            } else {
                // eslint-disable-next-line max-depth
                if (subProxy[fieldPart] === undefined) {
                    subProxy[fieldPart] = {}
                }
                subProxy = subProxy[fieldPart]
            }
        }
    }
}
