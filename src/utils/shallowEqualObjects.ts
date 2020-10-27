export default function shallowEqualObjects (objA: Record<string, any>, objB: Record<string, any>): boolean {
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
