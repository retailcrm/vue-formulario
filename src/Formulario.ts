import type { FormularioFormConstructor } from '../types/form'

import type {
    ValidationContext,
    ValidationRuleFn,
    ValidationMessageFn,
    ValidationMessageI18NFn,
    Violation,
} from '../types/validation'

import type { Options } from '../types/plugin'

import merge from '@/utils/merge'

import validationRules from '@/validation/rules'
import validationMessages from '@/validation/messages'

export default class Formulario {
    public validationRules: Record<string, ValidationRuleFn> = {}
    public validationMessages: Record<string, ValidationMessageI18NFn|string> = {}

    private readonly _registry: Map<string, InstanceType<FormularioFormConstructor>>

    public constructor (options?: Options) {
        this._registry = new Map()

        this.validationRules = validationRules
        this.validationMessages = validationMessages

        this.extend(options || {})
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    public extend (extendWith: Options): Formulario {
        if (typeof extendWith === 'object') {
            this.validationRules = merge(this.validationRules, extendWith.validationRules || {})
            this.validationMessages = merge(this.validationMessages, extendWith.validationMessages || {})
            return this
        }
        throw new Error(`[Formulario]: Formulario.extend(): should be passed an object (was ${typeof extendWith})`)
    }

    public runValidation (id: string): Promise<Record<string, Violation[]>> {
        if (!this._registry.has(id)) {
            throw new Error(`[Formulario]: Formulario.runValidation(): no forms with id "${id}"`)
        }

        const form = this._registry.get(id) as InstanceType<FormularioFormConstructor>

        return form.runValidation()
    }

    public resetValidation (id: string): void {
        if (!this._registry.has(id)) {
            return
        }

        const form = this._registry.get(id) as InstanceType<FormularioFormConstructor>

        form.resetValidation()
    }

    /**
     * Used by forms instances to add themselves into a registry
     * @internal
     */
    public register (id: string, form: InstanceType<FormularioFormConstructor>): void {
        if (this._registry.has(id)) {
            throw new Error(`[Formulario]: Formulario.register(): id "${id}" is already in use`)
        }

        this._registry.set(id, form)
    }

    /**
     * Used by forms instances to remove themselves from a registry
     * @internal
     */
    public unregister (id: string): void {
        if (this._registry.has(id)) {
            this._registry.delete(id)
        }
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     * @internal
     */
    public getRules (extendWith: Record<string, ValidationRuleFn> = {}): Record<string, ValidationRuleFn> {
        return merge(this.validationRules, extendWith)
    }

    /**
     * Get validation messages by merging any passed in with global messages.
     * @internal
     */
    public getMessages (vm: Vue, extendWith: Record<string, ValidationMessageI18NFn|string>): Record<string, ValidationMessageFn> {
        const raw = merge(this.validationMessages || {}, extendWith)
        const messages: Record<string, ValidationMessageFn> = {}

        for (const name in raw) {
            messages[name] = (context: ValidationContext, ...args: any[]): string => {
                return typeof raw[name] === 'string' ? raw[name] : raw[name](vm, context, ...args)
            }
        }

        return messages
    }
}
