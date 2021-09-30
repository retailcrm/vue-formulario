<template>
    <component
        :is="tag"
        v-bind="$attrs"
    >
        <slot :context="context" />
    </component>
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
import { deepEquals, has, snakeToCamel } from './utils'
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

import { UNREGISTER_BEHAVIOR } from '@/enum'

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

    @Prop({ default: 'div' }) tag!: string
    @Prop({ default: UNREGISTER_BEHAVIOR.NONE }) unregisterBehavior!: string

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

    private get context (): FormularioFieldContext<unknown> {
        return Object.defineProperty({
            name: this.fullPath,
            path: this.fullPath,
            runValidation: this.runValidation.bind(this),
            violations: this.violations,
            errors: this.localErrors,
            allErrors: [...this.localErrors, ...this.violations.map(v => v.message)],
        }, 'model', {
            get: () => this.modelGetConverter(this.proxy),
            set: (value: unknown): void => {
                this.syncProxy(this.modelSetConverter(value, this.proxy))
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
    private onValueChange (): void {
        this.syncProxy(this.value)
    }

    @Watch('proxy')
    private onProxyChange (): void {
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation()
        } else {
            this.resetValidation()
        }
    }

    /**
     * @internal
     */
    public created (): void {
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
            this.__FormularioForm_unregister(this.fullPath, this.unregisterBehavior)
        }
    }

    private syncProxy (value: unknown): void {
        if (!deepEquals(value, this.proxy)) {
            this.proxy = value
            this.$emit('input', value)

            if (typeof this.__FormularioForm_set === 'function') {
                this.__FormularioForm_set(this.fullPath, value)
                this.__FormularioForm_emitInput()
            }
        }
    }

    public runValidation (): Promise<Violation[]> {
        this.validationRun = this.validate().then(violations => {
            this.violations = violations
            this.emitValidation(this.fullPath, violations)

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
            value: this.proxy,
            name: this.fullPath,
            formValues: this.__FormularioForm_getState(),
        })
    }

    private emitValidation (path: string, violations: Violation[]): void {
        this.$emit('validation', { path, violations })
        if (typeof this.__FormularioForm_emitValidation === 'function') {
            this.__FormularioForm_emitValidation(path, violations)
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
