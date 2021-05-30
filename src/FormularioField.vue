<template>
    <div v-bind="$attrs">
        <slot :context="context" />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {
    Component,
    Inject,
    Model,
    Prop,
    Watch,
} from 'vue-property-decorator'
import { has, shallowEquals, snakeToCamel } from './utils'
import {
    processConstraints,
    validate,
    ValidationRuleFn,
    ValidationMessageI18NFn,
    Violation,
} from '@/validation/validator'

import {
    FormularioFieldContext,
    FormularioFieldModelGetConverter as ModelGetConverter,
    FormularioFieldModelSetConverter as ModelSetConverter,
    Empty,
} from '@/types'

const VALIDATION_BEHAVIOR = {
    DEMAND: 'demand',
    LIVE: 'live',
    SUBMIT: 'submit',
}

@Component({ name: 'FormularioField', inheritAttrs: false })
export default class FormularioField extends Vue {
    @Inject({ default: '' }) __Formulario_path!: string
    @Inject({ default: undefined }) __FormularioForm_set!: Function|undefined
    @Inject({ default: () => (): void => {} }) __FormularioForm_emitInput!: Function
    @Inject({ default: () => (): void => {} }) __FormularioForm_emitValidation!: Function
    @Inject({ default: undefined }) __FormularioForm_register!: Function|undefined
    @Inject({ default: undefined }) __FormularioForm_unregister!: Function|undefined

    @Inject({ default: () => (): Record<string, unknown> => ({}) })
    __FormularioForm_getState!: () => Record<string, unknown>

    @Model('input', { default: '' }) value!: unknown

    @Prop({
        required: true,
        validator: (name: unknown): boolean => typeof name === 'string' && name.length > 0,
    }) name!: string

    @Prop({ default: '' }) validation!: string|any[]
    @Prop({ default: () => ({}) }) validationRules!: Record<string, ValidationRuleFn>
    @Prop({ default: () => ({}) }) validationMessages!: Record<string, ValidationMessageI18NFn|string>
    @Prop({
        default: VALIDATION_BEHAVIOR.DEMAND,
        validator: behavior => Object.values(VALIDATION_BEHAVIOR).includes(behavior)
    }) validationBehavior!: string

    // Affects only setting of local errors
    @Prop({ default: false }) errorsDisabled!: boolean

    @Prop({ default: () => <U, T>(value: U|Empty): U|T|Empty => value }) modelGetConverter!: ModelGetConverter
    @Prop({ default: () => <T, U>(value: U|T): U|T => value }) modelSetConverter!: ModelSetConverter

    public proxy: unknown = this.hasModel ? this.value : ''

    private localErrors: string[] = []

    private violations: Violation[] = []

    private validationRun: Promise<Violation[]> = Promise.resolve([])

    public get fullPath (): string {
        return this.__Formulario_path !== '' ? `${this.__Formulario_path}.${this.name}` : this.name
    }

    /**
     * Determines if this formulario element is v-modeled or not.
     */
    public get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'value')
    }

    public get model (): unknown {
        const model = this.hasModel ? 'value' : 'proxy'
        return this.modelGetConverter(this[model])
    }

    public set model (value: unknown) {
        value = this.modelSetConverter(value, this.proxy)

        if (!shallowEquals(value, this.proxy)) {
            this.proxy = value
            this.$emit('input', value)

            if (typeof this.__FormularioForm_set === 'function') {
                this.__FormularioForm_set(this.fullPath, value)
                this.__FormularioForm_emitInput()
            }
        }
    }

    private get context (): FormularioFieldContext<unknown> {
        return Object.defineProperty({
            name: this.fullPath,
            runValidation: this.runValidation.bind(this),
            violations: this.violations,
            errors: this.localErrors,
            allErrors: [...this.localErrors, ...this.violations.map(v => v.message)],
        }, 'model', {
            get: () => this.model,
            set: (value: unknown) => {
                this.model = value
            },
        })
    }

    private get normalizedValidationRules (): Record<string, ValidationRuleFn> {
        const rules: Record<string, ValidationRuleFn> = {}
        Object.keys(this.validationRules).forEach(key => {
            rules[snakeToCamel(key)] = this.validationRules[key]
        })
        return rules
    }

    private get normalizedValidationMessages (): Record<string, ValidationMessageI18NFn|string> {
        const messages: Record<string, ValidationMessageI18NFn|string> = {}
        Object.keys(this.validationMessages).forEach(key => {
            messages[snakeToCamel(key)] = this.validationMessages[key]
        })
        return messages
    }

    @Watch('value')
    private onValueChange (newValue: unknown, oldValue: unknown): void {
        if (this.hasModel && !shallowEquals(newValue, oldValue)) {
            this.model = newValue
        }
    }

    @Watch('proxy')
    private onProxyChange (newValue: unknown, oldValue: unknown): void {
        if (!this.hasModel && !shallowEquals(newValue, oldValue)) {
            this.model = newValue
        }
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation()
        } else {
            this.violations = []
        }
    }

    /**
     * @internal
     */
    public created (): void {
        if (!shallowEquals(this.model, this.proxy)) {
            this.model = this.proxy
        }

        if (typeof this.__FormularioForm_register === 'function') {
            this.__FormularioForm_register(this.fullPath, this)
        }

        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation()
        }
    }

    /**
     * @internal
     */
    public beforeDestroy (): void {
        if (typeof this.__FormularioForm_unregister === 'function') {
            this.__FormularioForm_unregister(this.fullPath)
        }
    }

    public runValidation (): Promise<Violation[]> {
        this.validationRun = this.validate().then(violations => {
            const validationChanged = !shallowEquals(violations, this.violations)
            this.violations = violations

            if (validationChanged) {
                this.emitValidation({
                    name: this.fullPath,
                    violations: this.violations,
                })
            }

            return this.violations
        })

        return this.validationRun
    }

    private validate (): Promise<Violation[]> {
        return validate(processConstraints(
            this.validation,
            this.$formulario.getRules(this.normalizedValidationRules),
            this.$formulario.getMessages(this, this.normalizedValidationMessages),
        ), {
            value: this.context.model,
            name: this.context.name,
            formValues: this.__FormularioForm_getState(),
        })
    }

    private emitValidation (payload: { name: string; violations: Violation[] }): void {
        this.$emit('validation', payload)
        if (typeof this.__FormularioForm_emitValidation === 'function') {
            this.__FormularioForm_emitValidation(payload)
        }
    }

    public hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.validationRun.then(() => resolve(this.violations.length > 0))
            })
        })
    }

    /**
     * @internal
     */
    public setErrors (errors: string[]): void {
        if (!this.errorsDisabled) {
            this.localErrors = errors
        }
    }

    /**
     * @internal
     */
    public resetValidation (): void {
        this.localErrors = []
        this.violations = []
    }
}
</script>
