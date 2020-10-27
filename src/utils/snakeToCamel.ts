/**
 * Given a string, convert snake_case to camelCase
 */
export default function snakeToCamel (string: string): string {
    return string.replace(/([_][a-z0-9])/ig, ($1) => {
        if (string.indexOf($1) !== 0 && string[string.indexOf($1) - 1] !== '_') {
            return $1.toUpperCase().replace('_', '')
        }
        return $1
    })
}
