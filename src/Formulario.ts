import { VueConstructor } from 'vue'

import rules from '@/validation/rules'
import messages from '@/validation/messages'
import merge from '@/utils/merge'

import FormularioForm from '@/FormularioForm.vue'
import FormularioInput from '@/FormularioInput.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'

import {
    ValidationContext,
    CheckRuleFn,
    CreateMessageFn,
} from '@/validation/validator'

interface FormularioOptions {
    rules?: any;
    validationMessages?: Record<string, Function>;
}

// noinspection JSUnusedGlobalSymbols
/**
 * The base formulario library.
 */
export default class Formulario {
    public rules: Record<string, CheckRuleFn> = {}
    public messages: Record<string, Function> = {}

    constructor () {
        this.rules = rules
        this.messages = messages
    }

    /**
     * Install vue formulario, and register it’s components.
     */
    install (Vue: VueConstructor, options?: FormularioOptions): void {
        Vue.prototype.$formulario = this
        Vue.component('FormularioForm', FormularioForm)
        Vue.component('FormularioGrouping', FormularioGrouping)
        Vue.component('FormularioInput', FormularioInput)

        this.extend(options || {})
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend (extendWith: FormularioOptions): Formulario {
        if (typeof extendWith === 'object') {
            this.rules = merge(this.rules, extendWith.rules || {})
            this.messages = merge(this.messages, extendWith.validationMessages || {})
            return this
        }
        throw new Error(`[Formulario]: Formulario.extend() should be passed an object (was ${typeof extendWith})`)
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     */
    getRules (extendWith: Record<string, CheckRuleFn> = {}): Record<string, CheckRuleFn> {
        return merge(this.rules, extendWith)
    }

    getMessages (vm: Vue, extendWith: Record<string, Function>): Record<string, CreateMessageFn> {
        const raw = merge(this.messages || {}, extendWith)
        const messages: Record<string, CreateMessageFn> = {}

        for (const name in raw) {
            messages[name] = (context: ValidationContext, ...args: any[]): string => {
                return typeof raw[name] === 'string' ? raw[name] : raw[name](vm, context, ...args)
            }
        }

        return messages
    }
}
