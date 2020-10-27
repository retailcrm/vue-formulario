import { ValidationContext } from '@/validation/validator'

export default {
    /**
     * The default render method for error messages.
     */
    default (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.default', context)
    },

    /**
     * Valid accepted value.
     */
    accepted (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.accepted', context)
    },

    /**
     * The date is not after.
     */
    after (vm: Vue, context: ValidationContext, compare: string | false = false): string {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.after.compare', context)
        }

        return vm.$t('validation.after.default', context)
    },

    /**
     * The value is not a letter.
     */
    alpha (vm: Vue, context: Record<string, any>): string {
        return vm.$t('validation.alpha', context)
    },

    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.alphanumeric', context)
    },

    /**
     * The date is not before.
     */
    before (vm: Vue, context: ValidationContext, compare: string|false = false): string {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.before.compare', context)
        }

        return vm.$t('validation.before.default', context)
    },

    /**
     * The value is not between two numbers or lengths
     */
    between (vm: Vue, context: ValidationContext, from: number|any = 0, to: number|any = 10, force?: string): string {
        const data = { ...context, from, to }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$t('validation.between.force', data)
        }

        return vm.$t('validation.between.default', data)
    },

    /**
     * The confirmation field does not match
     */
    confirm (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.confirm', context)
    },

    /**
     * Is not a valid date.
     */
    date (vm: Vue, context: ValidationContext, format: string | false = false): string {
        if (typeof format === 'string' && format.length) {
            return vm.$t('validation.date.format', context)
        }

        return vm.$t('validation.date.default', context)
    },

    /**
     * Is not a valid email address.
     */
    email (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.email.default', context)
    },

    /**
     * Ends with specified value
     */
    endsWith (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.endsWith.default', context)
    },

    /**
     * Value is an allowed value.
     */
    in: function (vm: Vue, context: ValidationContext): string {
        if (typeof context.value === 'string' && context.value) {
            return vm.$t('validation.in.string', context)
        }

        return vm.$t('validation.in.default', context)
    },

    /**
     * Value is not a match.
     */
    matches (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.matches.default', context)
    },

    /**
     * The maximum value allowed.
     */
    max (vm: Vue, context: ValidationContext, maximum: string | number = 10, force?: string): string {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.max.array', maximum, context)
        }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.max.force', maximum, context)
        }

        return vm.$tc('validation.max.default', maximum, context)
    },

    /**
     * The maximum value allowed.
     */
    min (vm: Vue, context: ValidationContext, minimum: number | any = 1, force?: string): string {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.min.array', minimum, context)
        }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.min.force', minimum, context)
        }

        return vm.$tc('validation.min.default', minimum, context)
    },

    /**
     * The field is not an allowed value
     */
    not (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.not.default', context)
    },

    /**
     * The field is not a number
     */
    number (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.number.default', context)
    },

    /**
     * Required field.
     */
    required (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.required.default', context)
    },

    /**
     * Starts with specified value
     */
    startsWith (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.startsWith.default', context)
    },

    /**
     * Value is not a url.
     */
    url (vm: Vue, context: Record<string, any>): string {
        return vm.$t('validation.url.default', context)
    }
}
