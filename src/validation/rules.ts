import isUrl from 'is-url'
import { shallowEqualObjects, regexForFormat, has } from '@/libs/utils'
import { ValidationContext } from '@/validation/validator'

interface DateValidationContext extends ValidationContext {
    value: Date|string;
}

export default {
    /**
     * Rule: the value must be "yes", "on", "1", or true
     */
    accepted ({ value }: ValidationContext): Promise<boolean> {
        return Promise.resolve(['yes', 'on', '1', 1, true, 'true'].includes(value))
    },

    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    after ({ value }: DateValidationContext, compare: string | false = false): Promise<boolean> {
        const timestamp = compare !== false ? Date.parse(compare) : Date.now()
        const fieldValue = value instanceof Date ? value.getTime() : Date.parse(value)
        return Promise.resolve(isNaN(fieldValue) ? false : (fieldValue > timestamp))
    },

    /**
     * Rule: checks if the value is only alpha
     */
    alpha ({ value }: { value: string }, set = 'default'): Promise<boolean> {
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z]+$/
        }
        const selectedSet = has(sets, set) ? set : 'default'

        return Promise.resolve(sets[selectedSet].test(value))
    },

    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric ({ value }: { value: string }, set = 'default'): Promise<boolean> {
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-Z0-9À-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z0-9]+$/
        }
        const selectedSet = has(sets, set) ? set : 'default'

        return Promise.resolve(sets[selectedSet].test(value))
    },

    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    before ({ value }: DateValidationContext, compare: string|false = false): Promise<boolean> {
        const timestamp = compare !== false ? Date.parse(compare) : Date.now()
        const fieldValue = value instanceof Date ? value.getTime() : Date.parse(value)
        return Promise.resolve(isNaN(fieldValue) ? false : (fieldValue < timestamp))
    },

    /**
     * Rule: checks if the value is between two other values
     */
    between ({ value }: { value: string|number }, from: number|any = 0, to: number|any = 10, force?: string): Promise<boolean> {
        return Promise.resolve(((): boolean => {
            if (from === null || to === null || isNaN(from) || isNaN(to)) {
                return false
            }
            if ((!isNaN(Number(value)) && force !== 'length') || force === 'value') {
                value = Number(value)
                from = Number(from)
                to = Number(to)
                return (value > from && value < to)
            }
            if (typeof value === 'string' || force === 'length') {
                value = (!isNaN(Number(value)) ? value.toString() : value) as string
                return value.length > from && value.length < to
            }
            return false
        })())
    },

    /**
     * Confirm that the value of one field is the same as another, mostly used
     * for password confirmations.
     */
    confirm ({ value, formValues, name }: ValidationContext, field?: string): Promise<boolean> {
        return Promise.resolve(((): boolean => {
            let confirmationFieldName = field
            if (!confirmationFieldName) {
                confirmationFieldName = /_confirm$/.test(name) ? name.substr(0, name.length - 8) : `${name}_confirm`
            }
            return formValues[confirmationFieldName] === value
        })())
    },

    /**
     * Rule: ensures the value is a date according to Date.parse(), or a format
     * regex.
     */
    date ({ value }: { value: string }, format: string | false = false): Promise<boolean> {
        return Promise.resolve(format ? regexForFormat(format).test(value) : !isNaN(Date.parse(value)))
    },

    /**
     * Rule: tests
     */
    email ({ value }: { value: string }): Promise<boolean> {
        if (!value) {
            return Promise.resolve(true)
        }

        // eslint-disable-next-line
        const isEmail = /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
        return Promise.resolve(isEmail.test(value))
    },

    /**
     * Rule: Value ends with one of the given Strings
     */
    endsWith ({ value }: { value: any }, ...stack: any[]): Promise<boolean> {
        if (!value) {
            return Promise.resolve(true)
        }

        if (typeof value === 'string') {
            return Promise.resolve(stack.length === 0 || stack.some(str => value.endsWith(str)))
        }

        return Promise.resolve(false)
    },

    /**
     * Rule: Value is in an array (stack).
     */
    in ({ value }: { value: any }, ...stack: any[]): Promise<boolean> {
        return Promise.resolve(stack.some(item => {
            return typeof item === 'object' ? shallowEqualObjects(item, value) : item === value
        }))
    },

    /**
     * Rule: Match the value against a (stack) of patterns or strings
     */
    matches ({ value }: { value: any }, ...stack: any[]): Promise<boolean> {
        return Promise.resolve(!!stack.find(pattern => {
            if (typeof pattern === 'string' && pattern.substr(0, 1) === '/' && pattern.substr(-1) === '/') {
                pattern = new RegExp(pattern.substr(1, pattern.length - 2))
            }
            if (pattern instanceof RegExp) {
                return pattern.test(value)
            }
            return pattern === value
        }))
    },

    /**
     * Check the maximum value of a particular.
     */
    max ({ value }: { value: any }, maximum: string | number = 10, force?: string): Promise<boolean> {
        return Promise.resolve(((): boolean => {
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
        })())
    },

    /**
     * Check the minimum value of a particular.
     */
    min ({ value }: { value: any }, minimum: number | any = 1, force?: string): Promise<boolean> {
        return Promise.resolve(((): boolean => {
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
        })())
    },

    /**
     * Rule: Value is not in stack.
     */
    not ({ value }: { value: any }, ...stack: any[]): Promise<boolean> {
        return Promise.resolve(!stack.some(item => {
            return typeof item === 'object' ? shallowEqualObjects(item, value) : item === value
        }))
    },

    /**
     * Rule: checks if the value is only alpha numeric
     */
    number ({ value }: { value: any }): Promise<boolean> {
        return Promise.resolve(String(value).length > 0 && !isNaN(Number(value)))
    },

    /**
     * Rule: must be a value
     */
    required ({ value }: { value: any }, isRequired: string|boolean = true): Promise<boolean> {
        return Promise.resolve(((): boolean => {
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
        })())
    },

    /**
     * Rule: Value starts with one of the given Strings
     */
    startsWith ({ value }: { value: any }, ...stack: string[]): Promise<boolean> {
        if (!value) {
            return Promise.resolve(true)
        }

        if (typeof value === 'string') {
            return Promise.resolve(stack.length === 0 || stack.some(str => value.startsWith(str)))
        }

        return Promise.resolve(false)
    },

    /**
     * Rule: checks if a string is a valid url
     */
    url ({ value }: { value: string }): Promise<boolean> {
        return Promise.resolve(isUrl(value))
    },

    /**
     * Rule: not a true rule — more like a compiler flag.
     */
    bail (): Promise<boolean> {
        return Promise.resolve(true)
    }
}
