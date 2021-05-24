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
import { arrayify, has, shallowEquals, snakeToCamel } from './utils'
import {
    processConstraints,
    validate,
    ValidationRuleFn,
    ValidationMessageI18NFn,
    Violation,
} from '@/validation/validator'

const VALIDATION_BEHAVIOR = {
    DEMAND: 'demand',
    LIVE: 'live',
    SUBMIT: 'submit',
}

type FormularioFieldContext<U> = {
    model: U;
    name: string;
    runValidation(): Promise<Violation[]>;
    violations: Violation[];
    errors: string[];
    allErrors: string[];
}

interface ModelGetConverter {
    <U, T>(value: U|Empty): U|T|Empty;
}

interface ModelSetConverter {
    <T, U>(curr: U|T, prev: U|Empty): U|T;
}

type Empty = null | undefined

@Component({ name: 'FormularioField', inheritAttrs: false })
export default class FormularioField extends Vue {
    @Inject({ default: '' }) __Formulario_path!: string
    @Inject({ default: undefined }) __FormularioForm_set!: Function|undefined
    @Inject({ default: () => (): void => {} }) __FormularioForm_emitValidation!: Function
    @Inject({ default: undefined }) __FormularioForm_register!: Function|undefined
    @Inject({ default: undefined }) __FormularioForm_unregister!: Function|undefined

    @Inject({ default: () => (): Record<string, unknown> => ({}) })
    __FormularioForm_getValue!: () => Record<string, unknown>

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

    public proxy: unknown = this.getInitialValue()

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
        }

        this.$emit('input', value)

        if (typeof this.__FormularioForm_set === 'function') {
            this.__FormularioForm_set(this.fullPath, value)
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

    @Watch('proxy')
    private onProxyChange (newValue: unknown, oldValue: unknown): void {
        if (!this.hasModel && !shallowEquals(newValue, oldValue)) {
            this.context.model = newValue
        }
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation()
        } else {
            this.violations = []
        }
    }

    @Watch('value')
    private onValueChange (newValue: unknown, oldValue: unknown): void {
        if (this.hasModel && !shallowEquals(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    created (): void {
        this.initProxy()
        if (typeof this.__FormularioForm_register === 'function') {
            this.__FormularioForm_register(this.fullPath, this)
        }
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation()
        }
    }

    beforeDestroy (): void {
        if (typeof this.__FormularioForm_unregister === 'function') {
            this.__FormularioForm_unregister(this.fullPath)
        }
    }

    private getInitialValue (): unknown {
        return has(this.$options.propsData || {}, 'value') ? this.value : ''
    }

    private initProxy (): void {
        // This should only be run immediately on created and ensures that the
        // proxy and the model are both the same before any additional registration.
        if (!shallowEquals(this.context.model, this.proxy)) {
            this.context.model = this.proxy
        }
    }

    runValidation (): Promise<Violation[]> {
        this.validationRun = this.validate().then(violations => {
            const validationChanged = !shallowEquals(violations, this.violations)
            this.violations = violations
            if (validationChanged) {
                const payload = {
                    name: this.context.name,
                    violations: this.violations,
                }
                this.$emit('validation', payload)
                if (typeof this.__FormularioForm_emitValidation === 'function') {
                    this.__FormularioForm_emitValidation(payload)
                }
            }

            return this.violations
        })

        return this.validationRun
    }

    validate (): Promise<Violation[]> {
        return validate(processConstraints(
            this.validation,
            this.$formulario.getRules(this.normalizedValidationRules),
            this.$formulario.getMessages(this, this.normalizedValidationMessages),
        ), {
            value: this.context.model,
            name: this.context.name,
            formValues: this.__FormularioForm_getValue(),
        })
    }

    hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.validationRun.then(() => resolve(this.violations.length > 0))
            })
        })
    }

    /**
     * @internal
     */
    setErrors (errors: string[]): void {
        if (!this.errorsDisabled) {
            this.localErrors = arrayify(errors) as string[]
        }
    }

    /**
     * @internal
     */
    resetValidation (): void {
        this.localErrors = []
        this.violations = []
    }
}
</script>
