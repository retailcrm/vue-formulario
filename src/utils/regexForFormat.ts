/**
 * Escape a string for use in regular expressions.
 */
function escapeRegExp (string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

/**
 * Given a string format (date) return a regex to match against.
 */
export default function regexForFormat (format: string): RegExp {
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
