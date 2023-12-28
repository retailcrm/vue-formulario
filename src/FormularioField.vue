<template>
    <component
        :is="tag"
        v-bind="$attrs"
    >
        <slot :context="context" />
    </component>
</template>

<script lang="ts">
import type {
    Context,
    Empty,
    ModelGetConverter,
    ModelSetConverter,
    ValidationBehaviour,
    UnregisterBehaviour,
} from '../types/field'

import type {
    ValidationRuleFn,
    ValidationMessageI18NFn,
    Violation,
} from '../types/validation'

import Vue from 'vue'
import {
    Component,
    Inject,
    Model,
    Prop,
    Watch,
} from 'vue-property-decorator'

import { processConstraints, validate } from '@/validation/validator'

import { deepEquals, has, snakeToCamel } from './utils'

@Component({ name: 'FormularioField', inheritAttrs: false })
export default class FormularioField extends Vue {
    @Inject({ default: '' }) __Formulario_path!: string
    @Inject({ default: undefined }) __FormularioForm_set!: ((path: string, value: unknown) => void)|undefined
    @Inject({ default: () => (): void => {} }) __FormularioForm_emitInput!: () => void
    @Inject({ default: () => (): void => {} }) __FormularioForm_emitValidation!: (path: string, violations: Violation[]) => void
    @Inject({ default: undefined }) __FormularioForm_register!: ((path: string, field: FormularioField) => void)|undefined
    @Inject({ default: undefined }) __FormularioForm_unregister!: ((path: string, behavior: UnregisterBehaviour) => void)|undefined

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
        default: 'demand',
        validator: (behavior: string) => ['demand', 'live', 'submit'].includes(behavior)
    }) validationBehavior!: ValidationBehaviour

    // Affects only setting of local errors
    @Prop({ default: false }) errorsDisabled!: boolean

    @Prop({ default: () => <U, T>(value: U|Empty): U|T|Empty => value }) modelGetConverter!: ModelGetConverter
    @Prop({ default: () => <T, U>(value: U|T): U|T => value }) modelSetConverter!: ModelSetConverter

    @Prop({ default: 'div' }) tag!: string
    @Prop({ default: 'none' }) unregisterBehavior!: UnregisterBehaviour

    public proxy: unknown = this.hasModel ? this.value : ''

    private localErrors: string[] = []

    private violations: Violation[] = []

    private validationRun: Promise<Violation[]> = Promise.resolve([])

    public get fullPath (): string {
        return this.__Formulario_path !== '' ? `${this.__Formulario_path}.${this.name}` : this.name
    }

    /** Determines if this formulario element is v-modeled or not. */
    public get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'value')
    }

    private get context (): Context<unknown> {
        return Object.defineProperty({
            name: this.fullPath,
            path: this.fullPath,
            runValidation: this.runValidation.bind(this),
            violations: this.violations,
            errors: this.localErrors,
            allErrors: [...this.localErrors, ...this.violations.map(v => v.message)],
        } as Context<unknown>, 'model', {
            get: () => this.modelGetConverter(this.proxy),
            set: (value: unknown): void => {
                this._syncProxy(this.modelSetConverter(value, this.proxy))
            },
        })
    }

    private get _normalizedValidationRules (): Record<string, ValidationRuleFn> {
        const rules: Record<string, ValidationRuleFn> = {}
        Object.keys(this.validationRules).forEach(key => {
            rules[snakeToCamel(key)] = this.validationRules[key]
        })
        return rules
    }

    private get _normalizedValidationMessages (): Record<string, ValidationMessageI18NFn|string> {
        const messages: Record<string, ValidationMessageI18NFn|string> = {}
        Object.keys(this.validationMessages).forEach(key => {
            messages[snakeToCamel(key)] = this.validationMessages[key]
        })
        return messages
    }

    @Watch('value')
    private _onValueChange (): void {
        this._syncProxy(this.value)
    }

    @Watch('proxy')
    private _onProxyChange (): void {
        if (this.validationBehavior === 'live') {
            this.runValidation()
        } else {
            this.resetValidation()
        }
    }

    /** @internal */
    public created (): void {
        if (typeof this.__FormularioForm_register === 'function') {
            this.__FormularioForm_register(this.fullPath, this)
        }

        if (this.validationBehavior === 'live') {
            this.runValidation()
        }
    }

    /** @internal */
    public beforeDestroy (): void {
        if (typeof this.__FormularioForm_unregister === 'function') {
            this.__FormularioForm_unregister(this.fullPath, this.unregisterBehavior)
        }
    }

    public runValidation (): Promise<Violation[]> {
        this.validationRun = this._validate().then(violations => {
            this.violations = violations
            this._emitValidation(this.fullPath, violations)

            return this.violations
        })

        return this.validationRun
    }

    public hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.validationRun.then(() => resolve(this.violations.length > 0))
            })
        })
    }

    /** @internal */
    public setErrors (errors: string[]): void {
        if (!this.errorsDisabled) {
            this.localErrors = errors
        }
    }

    /** @internal */
    public resetValidation (): void {
        this.localErrors = []
        this.violations = []
    }

    private _syncProxy (value: unknown): void {
        if (!deepEquals(value, this.proxy)) {
            this.proxy = value
            this.$emit('input', value)

            if (typeof this.__FormularioForm_set === 'function') {
                this.__FormularioForm_set(this.fullPath, value)
                this.__FormularioForm_emitInput()
            }
        }
    }

    private _validate (): Promise<Violation[]> {
        return validate(processConstraints(
            this.validation,
            this.$formulario.getRules(this._normalizedValidationRules),
            this.$formulario.getMessages(this, this._normalizedValidationMessages),
        ), {
            value: this.proxy,
            name: this.fullPath,
            formValues: this.__FormularioForm_getState(),
        })
    }

    private _emitValidation (path: string, violations: Violation[]): void {
        this.$emit('validation', { path, violations })
        if (typeof this.__FormularioForm_emitValidation === 'function') {
            this.__FormularioForm_emitValidation(path, violations)
        }
    }
}
</script>
