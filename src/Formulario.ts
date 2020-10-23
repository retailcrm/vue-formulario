import { VueConstructor } from 'vue'

import { has } from '@/libs/utils'
import rules from '@/validation/rules'
import messages from '@/validation/messages'
import merge from '@/utils/merge'

import FormularioForm from '@/FormularioForm.vue'
import FormularioInput from '@/FormularioInput.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'

import {
    ValidationContext,
    ValidationRule,
} from '@/validation/types'

interface FormularioOptions {
    rules?: any;
    validationMessages?: any;
}

// noinspection JSUnusedGlobalSymbols
/**
 * The base formulario library.
 */
export default class Formulario {
    public options: FormularioOptions
    public idRegistry: { [name: string]: number }

    constructor () {
        this.options = {
            rules,
            validationMessages: messages,
        }
        this.idRegistry = {}
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
     * Produce a deterministically generated id based on the sequence by which it
     * was requested. This should be *theoretically* the same SSR as client side.
     * However, SSR and deterministic ids can be very challenging, so this
     * implementation is open to community review.
     */
    nextId (vm: Vue): string {
        const path = vm.$route && vm.$route.path ? vm.$route.path : false
        const pathPrefix = path ? vm.$route.path.replace(/[/\\.\s]/g, '-') : 'global'
        if (!has(this.idRegistry, pathPrefix)) {
            this.idRegistry[pathPrefix] = 0
        }
        return `formulario-${pathPrefix}-${++this.idRegistry[pathPrefix]}`
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend (extendWith: FormularioOptions): Formulario {
        if (typeof extendWith === 'object') {
            this.options = merge(this.options, extendWith)
            return this
        }
        throw new Error(`VueFormulario extend() should be passed an object (was ${typeof extendWith})`)
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     */
    rules (rules: Record<string, ValidationRule> = {}): () => Record<string, ValidationRule> {
        return { ...this.options.rules, ...rules }
    }

    /**
     * Get the validation message for a particular error.
     */
    validationMessage (rule: string, context: ValidationContext, vm: Vue): string {
        if (has(this.options.validationMessages, rule)) {
            return this.options.validationMessages[rule](vm, context)
        } else {
            return this.options.validationMessages.default(vm, context)
        }
    }
}
