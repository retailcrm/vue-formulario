import {
    ValidationContext,
    ValidationMessageI18NFn,
} from '@/validation/validator'

/**
 * Message builders, names match rules names, see @/validation/rules
 */
const messages: Record<string, ValidationMessageI18NFn> = {
    /**
     * Fallback for rules without message builder
     * @param vm
     * @param context
     */
    default (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.default', context)
    },

    accepted (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.accepted', context)
    },

    after (vm: Vue, context: ValidationContext, compare: string | false = false): string {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.after.compare', context)
        }

        return vm.$t('validation.after.default', context)
    },

    alpha (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.alpha', context)
    },

    alphanumeric (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.alphanumeric', context)
    },

    before (vm: Vue, context: ValidationContext, compare: string|false = false): string {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.before.compare', context)
        }

        return vm.$t('validation.before.default', context)
    },

    between (vm: Vue, context: ValidationContext, from: number|any = 0, to: number|any = 10, force?: string): string {
        const data = { ...context, from, to }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$t('validation.between.force', data)
        }

        return vm.$t('validation.between.default', data)
    },

    confirm (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.confirm', context)
    },

    date (vm: Vue, context: ValidationContext, format: string | false = false): string {
        if (typeof format === 'string' && format.length) {
            return vm.$t('validation.date.format', context)
        }

        return vm.$t('validation.date.default', context)
    },

    email (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.email.default', context)
    },

    endsWith (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.endsWith.default', context)
    },

    in (vm: Vue, context: ValidationContext): string {
        if (typeof context.value === 'string' && context.value) {
            return vm.$t('validation.in.string', context)
        }

        return vm.$t('validation.in.default', context)
    },

    matches (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.matches.default', context)
    },

    max (vm: Vue, context: ValidationContext, maximum: string | number = 10, force?: string): string {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.max.array', maximum, context)
        }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.max.force', maximum, context)
        }

        return vm.$tc('validation.max.default', maximum, context)
    },

    min (vm: Vue, context: ValidationContext, minimum: number | any = 1, force?: string): string {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.min.array', minimum, context)
        }

        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.min.force', minimum, context)
        }

        return vm.$tc('validation.min.default', minimum, context)
    },

    not (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.not.default', context)
    },

    number (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.number.default', context)
    },

    required (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.required.default', context)
    },

    startsWith (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.startsWith.default', context)
    },

    url (vm: Vue, context: ValidationContext): string {
        return vm.$t('validation.url.default', context)
    }
}

export default messages
