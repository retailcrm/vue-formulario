import isUrl from 'is-url'
import { has, regexForFormat, shallowEquals } from '@/utils'
import {
    ValidationContext,
    ValidationRuleFn,
} from '@/validation/validator'

const rules: Record<string, ValidationRuleFn> = {
    /**
     * Rule: the value must be "yes", "on", "1", or true
     */
    accepted ({ value }: ValidationContext): boolean {
        return ['yes', 'on', '1', 1, true, 'true'].includes(value)
    },

    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    after ({ value }: ValidationContext, compare: string | false = false): boolean {
        const compareTimestamp = compare !== false ? Date.parse(compare) : Date.now()
        const valueTimestamp = value instanceof Date ? value.getTime() : Date.parse(value)

        return isNaN(valueTimestamp) ? false : (valueTimestamp > compareTimestamp)
    },

    /**
     * Rule: checks if the value is only alpha
     */
    alpha ({ value }: ValidationContext, set = 'default'): boolean {
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z]+$/,
        }

        return typeof value === 'string' && sets[has(sets, set) ? set : 'default'].test(value)
    },

    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric ({ value }: ValidationContext, set = 'default'): boolean {
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-Z0-9À-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z0-9]+$/
        }

        return typeof value === 'string' && sets[has(sets, set) ? set : 'default'].test(value)
    },

    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    before ({ value }: ValidationContext, compare: string|false = false): boolean {
        const compareTimestamp = compare !== false ? Date.parse(compare) : Date.now()
        const valueTimestamp = value instanceof Date ? value.getTime() : Date.parse(value)

        return isNaN(valueTimestamp) ? false : (valueTimestamp < compareTimestamp)
    },

    /**
     * Rule: checks if the value is between two other values
     */
    between ({ value }: ValidationContext, from: number|any = 0, to: number|any = 10, force?: string): boolean {
        if (from === null || to === null || isNaN(from) || isNaN(to)) {
            return false
        }

        if ((!isNaN(Number(value)) && force !== 'length') || force === 'value') {
            value = Number(value)
            return (value > Number(from) && value < Number(to))
        }

        if (typeof value === 'string' || force === 'length') {
            value = (!isNaN(Number(value)) ? value.toString() : value) as string
            return value.length > from && value.length < to
        }

        return false
    },

    /**
     * Confirm that the value of one field is the same as another, mostly used
     * for password confirmations.
     */
    confirm ({ value, formValues, name }: ValidationContext, field?: string): boolean {
        let confirmationFieldName = field
        if (!confirmationFieldName) {
            confirmationFieldName = /_confirm$/.test(name) ? name.substr(0, name.length - 8) : `${name}_confirm`
        }
        return formValues[confirmationFieldName] === value
    },

    /**
     * Rule: ensures the value is a date according to Date.parse(), or a format
     * regex.
     */
    date ({ value }: ValidationContext, format: string | false = false): boolean {
        return format ? regexForFormat(format).test(value) : !isNaN(Date.parse(value))
    },

    /**
     * Rule: tests
     */
    email ({ value }: ValidationContext): boolean {
        if (!value) {
            return true
        }

        // eslint-disable-next-line
        const isEmail = /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
        return isEmail.test(value)
    },

    /**
     * Rule: Value ends with one of the given Strings
     */
    endsWith ({ value }: ValidationContext, ...stack: any[]): boolean {
        if (!value) {
            return true
        }

        if (typeof value === 'string') {
            return stack.length === 0 || stack.some(str => value.endsWith(str))
        }

        return false
    },

    /**
     * Rule: Value is in an array (stack).
     */
    in ({ value }: ValidationContext, ...stack: any[]): boolean {
        return stack.some(item => shallowEquals(item, value))
    },

    /**
     * Rule: Match the value against a (stack) of patterns or strings
     */
    matches ({ value }: ValidationContext, ...stack: any[]): boolean {
        return !!stack.find(pattern => {
            if (typeof pattern === 'string' && pattern.substr(0, 1) === '/' && pattern.substr(-1) === '/') {
                pattern = new RegExp(pattern.substr(1, pattern.length - 2))
            }

            if (pattern instanceof RegExp) {
                return pattern.test(value)
            }

            return pattern === value
        })
    },

    /**
     * Check the maximum value of a particular.
     */
    max ({ value }: ValidationContext, maximum: string | number = 10, force?: string): boolean {
        if (Array.isArray(value)) {
            maximum = !isNaN(Number(maximum)) ? Number(maximum) : maximum
            return value.length <= maximum
        }

        if ((!isNaN(value) && force !== 'length') || force === 'value') {
            value = !isNaN(value) ? Number(value) : value
            return value <= maximum
        }

        if (typeof value === 'string' || (force === 'length')) {
            value = !isNaN(value) ? value.toString() : value
            return value.length <= maximum
        }

        return false
    },

    /**
     * Check the minimum value of a particular.
     */
    min ({ value }: ValidationContext, minimum: number | any = 1, force?: string): boolean {
        if (Array.isArray(value)) {
            minimum = !isNaN(minimum) ? Number(minimum) : minimum
            return value.length >= minimum
        }

        if ((!isNaN(value) && force !== 'length') || force === 'value') {
            value = !isNaN(value) ? Number(value) : value
            return value >= minimum
        }

        if (typeof value === 'string' || (force === 'length')) {
            value = !isNaN(value) ? value.toString() : value
            return value.length >= minimum
        }

        return false
    },

    /**
     * Rule: Value is not in stack.
     */
    not ({ value }: ValidationContext, ...stack: any[]): boolean {
        return !stack.some(item => shallowEquals(item, value))
    },

    /**
     * Rule: checks if the value is only alpha numeric
     */
    number ({ value }: ValidationContext): boolean {
        return String(value).length > 0 && !isNaN(Number(value))
    },

    /**
     * Rule: must be a value
     */
    required ({ value }: ValidationContext, isRequired: string|boolean = true): boolean {
        if (!isRequired || ['no', 'false'].includes(isRequired as string)) {
            return true
        }

        if (Array.isArray(value)) {
            return !!value.length
        }

        if (typeof value === 'string') {
            return !!value
        }

        if (typeof value === 'object') {
            return (!value) ? false : !!Object.keys(value).length
        }

        return true
    },

    /**
     * Rule: Value starts with one of the given Strings
     */
    startsWith ({ value }: ValidationContext, ...stack: string[]): boolean {
        if (!value) {
            return true
        }

        if (typeof value === 'string') {
            return stack.length === 0 || stack.some(str => value.startsWith(str))
        }

        return false
    },

    /**
     * Rule: checks if a string is a valid url
     */
    url ({ value }: ValidationContext): boolean {
        if (!value) {
            return true
        }

        return isUrl(value)
    },

    /**
     * Rule: not a true rule — more like a compiler flag.
     */
    bail (): boolean {
        return true
    },
}

export default rules
