import { ValidationContext } from '@/validation/types'

/**
 * This is an object of functions that each produce valid responses. There's no
 * need for these to be 1-1 with english, feel free to change the wording or
 * use/not use any of the variables available in the object or the
 * arguments for the message to make the most sense in your language and culture.
 *
 * The validation context object includes the following properties:
 * {
 *   args        // Array of rule arguments: between:5,10 (args are ['5', '10'])
 *   name:       // The validation name to be used
 *   value:      // The value of the field (do not mutate!),
 *   formValues: // If wrapped in a FormulateForm, the value of other form fields.
 * }
 */
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
    after (vm: Vue, context: ValidationContext): string {
        if (Array.isArray(context.args) && context.args.length) {
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
    alphanumeric (vm: Vue, context: Record<string, any>): string {
        return vm.$t('validation.alphanumeric', context)
    },

    /**
     * The date is not before.
     */
    before (vm: Vue, context: ValidationContext): string {
        if (Array.isArray(context.args) && context.args.length) {
            return vm.$t('validation.before.compare', context)
        }

        return vm.$t('validation.before.default', context)
    },

    /**
     * The value is not between two numbers or lengths
     */
    between (vm: Vue, context: ValidationContext): string {
        const force = Array.isArray(context.args) && context.args[2] ? context.args[2] : false

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$t('validation.between.force', context)
        }

        return vm.$t('validation.between.default', context)
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
    date (vm: Vue, context: ValidationContext): string {
        if (Array.isArray(context.args) && context.args.length) {
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
    max (vm: Vue, context: ValidationContext): string {
        const maximum = context.args[0] as number

        if (Array.isArray(context.value)) {
            return vm.$tc('validation.max.array', maximum, context)
        }
        const force = Array.isArray(context.args) && context.args[1] ? context.args[1] : false
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.max.force', maximum, context)
        }
        return vm.$tc('validation.max.default', maximum, context)
    },

    /**
     * The (field-level) error message for mime errors.
     */
    mime (vm: Vue, context: ValidationContext): string {
        const types = context.args[0]

        if (types) {
            return vm.$t('validation.mime.default', context)
        } else {
            return vm.$t('validation.mime.no_formats_allowed', context)
        }
    },

    /**
     * The maximum value allowed.
     */
    min (vm: Vue, context: ValidationContext): string {
        const minimum = context.args[0] as number

        if (Array.isArray(context.value)) {
            return vm.$tc('validation.min.array', minimum, context)
        }
        const force = Array.isArray(context.args) && context.args[1] ? context.args[1] : false
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
