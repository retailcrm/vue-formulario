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
 *   vm: the     // FormulateInput instance this belongs to,
 *   formValues: // If wrapped in a FormulateForm, the value of other form fields.
 * }
 */
const validationMessages = {
    /**
     * The default render method for error messages.
     */
    default: function (vm, context) {
        return vm.$t('validation.default', context)
    },

    /**
     * Valid accepted value.
     */
    accepted: function (vm, context) {
        return vm.$t('validation.accepted', context)
    },

    /**
     * The date is not after.
     */
    after: function (vm, context) {
        if (Array.isArray(context.args) && context.args.length) {
            context.compare = context.args[0]
            return vm.$t('validation.after.compare', context)
        }

        return vm.$t('validation.after.default', context)
    },

    /**
     * The value is not a letter.
     */
    alpha: function (vm, context) {
        return vm.$t('validation.alpha', context)
    },

    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric: function (vm, context) {
        return vm.$t('validation.alphanumeric', context)
    },

    /**
     * The date is not before.
     */
    before: function (vm, context) {
        if (Array.isArray(context.args) && context.args.length) {
            context.compare = context.args[0]
            return vm.$t('validation.before.compare', context)
        }

        return vm.$t('validation.before.default', context)
    },

    /**
     * The value is not between two numbers or lengths
     */
    between: function (vm, context) {
        context.from = context.args[0]
        context.to = context.args[1]

        const force = Array.isArray(context.args) && context.args[2] ? context.args[2] : false
        if ((!isNaN(value) && force !== 'length') || force === 'value') {
            return vm.$t('validation.between.force', context)
        }

        return vm.$t('validation.between.default', context)
    },

    /**
     * The confirmation field does not match
     */
    confirm: function (vm, context) {
        return vm.$t('validation.confirm', context)
    },

    /**
     * Is not a valid date.
     */
    date: function (vm, context) {
        if (Array.isArray(context.args) && context.args.length) {
            context.format = context.args[0]
            return vm.$t('validation.date.format', context)
        }

        return vm.$t('validation.date.default', context)
    },

    /**
     * Is not a valid email address.
     */
    email: function (vm, context) {
        return vm.$t('validation.email.default', context)
    },

    /**
     * Ends with specified value
     */
    endsWith: function (vm, context) {
        return vm.$t('validation.endsWith.default', context)
    },

    /**
     * Value is an allowed value.
     */
    in: function (vm, context) {
        if (typeof context.value === 'string' && context.value) {
            return vm.$t('validation.in.string', context)
        }

        return vm.$t('validation.in.default', context)
    },

    /**
     * Value is not a match.
     */
    matches: function (vm, context) {
        return vm.$t('validation.matches.default', context)
    },

    /**
     * The maximum value allowed.
     */
    max: function (vm, context) {
        context.maximum = context.args[0]

        if (Array.isArray(context.value)) {
            return vm.$tc('validation.max.array', context.maximum, context)
        }
        const force = Array.isArray(context.args) && context.args[1] ? context.args[1] : false
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.max.force', context.maximum, context)
        }
        return vm.$tc('validation.max.default', context.maximum, context)
    },

    /**
     * The (field-level) error message for mime errors.
     */
    mime: function (vm, context) {
        context.types = context.args[0]
        if (context.types) {
            return vm.$t('validation.mime.default', context)
        } else {
            return vm.$t('validation.mime.no_formats_allowed', context)
        }
    },

    /**
     * The maximum value allowed.
     */
    min: function (vm, context) {
        context.minimum = context.args[0]

        if (Array.isArray(context.value)) {
            return vm.$tc('validation.min.array', context.minimum, context)
        }
        const force = Array.isArray(context.args) && context.args[1] ? context.args[1] : false
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.min.force', context.minimum, context)
        }
        return vm.$tc('validation.min.default', context.minimum, context)
    },

    /**
     * The field is not an allowed value
     */
    not: function (vm, context) {
        return vm.$t('validation.not.default', context)
    },

    /**
     * The field is not a number
     */
    number: function (vm, context) {
        return vm.$t('validation.number.default', context)
    },

    /**
     * Required field.
     */
    required: function (vm, context) {
        return vm.$t('validation.required.default', context)
    },

    /**
     * Starts with specified value
     */
    startsWith: function (vm, context) {
        return vm.$t('validation.startsWith.default', context)
    },

    /**
     * Value is not a url.
     */
    url: function (vm, context) {
        return vm.$t('validation.url.default', context)
    }
}

/**
 * This creates a vue-formulario plugin that can be imported and used on each
 * project.
 */
export default function (instance) {
    instance.extend({
        validationMessages
    })
}
