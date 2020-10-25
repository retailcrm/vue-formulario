export default function isScalar (data: any): boolean {
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
