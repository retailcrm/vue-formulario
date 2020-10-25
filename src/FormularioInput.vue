<template>
    <div class="formulario-input">
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
import { arrayify, has, shallowEqualObjects, snakeToCamel } from './libs/utils'
import {
    CheckRuleFn,
    CreateMessageFn,
    processConstraints,
    validate,
    Violation,
} from '@/validation/validator'

const VALIDATION_BEHAVIOR = {
    DEMAND: 'demand',
    LIVE: 'live',
    SUBMIT: 'submit',
}

@Component({ name: 'FormularioInput', inheritAttrs: false })
export default class FormularioInput extends Vue {
    @Inject({ default: undefined }) formularioSetter!: Function|undefined
    @Inject({ default: () => (): void => {} }) onFormularioFieldValidation!: Function
    @Inject({ default: undefined }) formularioRegister!: Function|undefined
    @Inject({ default: undefined }) formularioDeregister!: Function|undefined
    @Inject({ default: () => (): Record<string, any> => ({}) }) getFormValues!: Function
    @Inject({ default: undefined }) addErrorObserver!: Function|undefined
    @Inject({ default: undefined }) removeErrorObserver!: Function|undefined
    @Inject({ default: '' }) path!: string

    @Model('input', { default: '' }) value!: any

    @Prop({
        required: true,
        validator: (name: any): boolean => typeof name === 'string' && name.length > 0,
    }) name!: string

    @Prop({ default: '' }) validation!: string|any[]
    @Prop({ default: () => ({}) }) validationRules!: Record<string, CheckRuleFn>
    @Prop({ default: () => ({}) }) validationMessages!: Record<string, CreateMessageFn|string>
    @Prop({ default: () => [] }) errors!: string[]
    @Prop({
        default: VALIDATION_BEHAVIOR.DEMAND,
        validator: behavior => Object.values(VALIDATION_BEHAVIOR).includes(behavior)
    }) errorBehavior!: string

    @Prop({ default: false }) errorsDisabled!: boolean

    proxy: any = this.getInitialValue()
    localErrors: string[] = []
    violations: Violation[] = []
    pendingValidation: Promise<any> = Promise.resolve()

    get fullQualifiedName (): string {
        return this.path !== '' ? `${this.path}.${this.name}` : this.name
    }

    get model (): any {
        const model = this.hasModel ? 'value' : 'proxy'
        if (this[model] === undefined) {
            return ''
        }
        return this[model]
    }

    set model (value: any) {
        if (!shallowEqualObjects(value, this.proxy)) {
            this.proxy = value
        }

        this.$emit('input', value)

        if (typeof this.formularioSetter === 'function') {
            this.formularioSetter(this.context.name, value)
        }
    }

    get context (): Record<string, any> {
        return Object.defineProperty({
            name: this.fullQualifiedName,
            validate: this.performValidation.bind(this),
            violations: this.violations,
            errors: this.mergedErrors,
            // @TODO: Deprecated, will be removed in next versions, use context.violations & context.errors separately
            allErrors: [
                ...this.mergedErrors.map(message => ({ rule: null, args: [], context: null, message })),
                ...arrayify(this.violations)
            ],
        }, 'model', {
            get: () => this.model,
            set: (value: any) => {
                this.model = value
            },
        })
    }

    get normalizedValidationRules (): Record<string, CheckRuleFn> {
        const rules: Record<string, CheckRuleFn> = {}
        Object.keys(this.validationRules).forEach(key => {
            rules[snakeToCamel(key)] = this.validationRules[key]
        })
        return rules
    }

    get normalizedValidationMessages (): Record<string, any> {
        const messages: Record<string, any> = {}
        Object.keys(this.validationMessages).forEach((key) => {
            messages[snakeToCamel(key)] = this.validationMessages[key]
        })
        return messages
    }

    /**
     * These are errors we that have been explicitly passed to us.
     */
    get mergedErrors (): string[] {
        return [...arrayify(this.errors), ...this.localErrors]
    }

    /**
     * Determines if this formulario element is v-modeled or not.
     */
    get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'value')
    }

    @Watch('proxy')
    onProxyChanged (newValue: any, oldValue: any): void {
        if (!this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
        if (this.errorBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.performValidation()
        } else {
            this.violations = []
        }
    }

    @Watch('value')
    onValueChanged (newValue: any, oldValue: any): void {
        if (this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    created (): void {
        this.initProxy()
        if (typeof this.formularioRegister === 'function') {
            this.formularioRegister(this.fullQualifiedName, this)
        }
        if (typeof this.addErrorObserver === 'function' && !this.errorsDisabled) {
            this.addErrorObserver({ callback: this.setErrors, type: 'input', field: this.fullQualifiedName })
        }
        if (this.errorBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.performValidation()
        }
    }

    // noinspection JSUnusedGlobalSymbols
    beforeDestroy (): void {
        if (!this.errorsDisabled && typeof this.removeErrorObserver === 'function') {
            this.removeErrorObserver(this.setErrors)
        }
        if (typeof this.formularioDeregister === 'function') {
            this.formularioDeregister(this.fullQualifiedName)
        }
    }

    getInitialValue (): any {
        return has(this.$options.propsData || {}, 'value') ? this.value : ''
    }

    initProxy (): void {
        // This should only be run immediately on created and ensures that the
        // proxy and the model are both the same before any additional registration.
        if (!shallowEqualObjects(this.context.model, this.proxy)) {
            this.context.model = this.proxy
        }
    }

    performValidation (): Promise<void> {
        this.pendingValidation = this.validate().then(violations => {
            const validationChanged = !shallowEqualObjects(violations, this.violations)
            this.violations = violations
            if (validationChanged) {
                const payload = {
                    name: this.context.name,
                    violations: this.violations,
                }
                this.$emit('validation', payload)
                if (typeof this.onFormularioFieldValidation === 'function') {
                    this.onFormularioFieldValidation(payload)
                }
            }

            return this.violations
        })
        return this.pendingValidation
    }

    validate (): Promise<Violation[]> {
        return validate(
            processConstraints(
                this.validation,
                this.$formulario.getRules(this.normalizedValidationRules),
                this.$formulario.getMessages(this, this.normalizedValidationMessages),
            ), {
                value: this.context.model,
                name: this.context.name,
                formValues: this.getFormValues(),
            }
        )
    }

    hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.pendingValidation.then(() => resolve(this.violations.length > 0))
            })
        })
    }

    setErrors (errors: string[]): void {
        this.localErrors = arrayify(errors)
    }

    resetValidation (): void {
        this.localErrors = []
        this.violations = []
    }
}
</script>
