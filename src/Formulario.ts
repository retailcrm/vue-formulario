import merge from '@/utils/merge'
import validationRules from '@/validation/rules'
import validationMessages from '@/validation/messages'

import {
    ValidationContext,
    CheckRuleFn,
    CreateMessageFn,
} from '@/validation/validator'

export interface FormularioOptions {
    validationRules?: any;
    validationMessages?: Record<string, Function>;
}

// noinspection JSUnusedGlobalSymbols
/**
 * The base formulario library.
 */
export default class Formulario {
    public validationRules: Record<string, CheckRuleFn> = {}
    public validationMessages: Record<string, Function> = {}

    constructor (options?: FormularioOptions) {
        this.validationRules = validationRules
        this.validationMessages = validationMessages

        this.extend(options || {})
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend (extendWith: FormularioOptions): Formulario {
        if (typeof extendWith === 'object') {
            this.validationRules = merge(this.validationRules, extendWith.validationRules || {})
            this.validationMessages = merge(this.validationMessages, extendWith.validationMessages || {})
            return this
        }
        throw new Error(`[Formulario]: Formulario.extend() should be passed an object (was ${typeof extendWith})`)
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     */
    getRules (extendWith: Record<string, CheckRuleFn> = {}): Record<string, CheckRuleFn> {
        return merge(this.validationRules, extendWith)
    }

    /**
     * Get validation messages by merging any passed in with global messages.
     */
    getMessages (vm: Vue, extendWith: Record<string, Function>): Record<string, CreateMessageFn> {
        const raw = merge(this.validationMessages || {}, extendWith)
        const messages: Record<string, CreateMessageFn> = {}

        for (const name in raw) {
            messages[name] = (context: ValidationContext, ...args: any[]): string => {
                return typeof raw[name] === 'string' ? raw[name] : raw[name](vm, context, ...args)
            }
        }

        return messages
    }
}
