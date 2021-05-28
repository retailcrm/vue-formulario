export { default as clone } from './clone'
export { default as has } from './has'
export { default as merge } from './merge'
export { default as regexForFormat } from './regexForFormat'
export { default as shallowEquals } from './shallowEquals'
export { default as snakeToCamel } from './snakeToCamel'

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

        if (subProxy === undefined) {
            break
        }

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
