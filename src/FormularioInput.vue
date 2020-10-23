<template>
    <div class="formulario-input">
        <slot
            :id="id"
            :context="context"
            :violations="validationErrors"
        />
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
import { arrayify, has, parseRules, shallowEqualObjects, snakeToCamel } from './libs/utils'
import {
    ValidationContext,
    ValidationError,
    ValidationRule,
} from '@/validation/types'
import {
    createValidatorGroups,
    validate,
    Validator,
    ValidatorGroup,
} from '@/validation/validator'

const ERROR_BEHAVIOR = {
    BLUR: 'blur',
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

    @Model('input', { default: '' }) formularioValue: any

    @Prop({ default: null }) id!: string|number|null
    @Prop({ required: true }) name!: string
    @Prop({ default: false }) value!: any
    @Prop({ default: '' }) validation!: string|any[]
    @Prop({ default: () => ({}) }) validationRules!: Record<string, ValidationRule>
    @Prop({ default: () => ({}) }) validationMessages!: Record<string, any>
    @Prop({ default: () => [] }) errors!: string[]
    @Prop({
        default: ERROR_BEHAVIOR.BLUR,
        validator: behavior => [ERROR_BEHAVIOR.BLUR, ERROR_BEHAVIOR.LIVE, ERROR_BEHAVIOR.SUBMIT].includes(behavior)
    }) errorBehavior!: string

    @Prop({ default: false }) disableErrors!: boolean

    defaultId: string = this.$formulario.nextId(this)
    proxy: Record<string, any> = this.getInitialValue()
    localErrors: string[] = []
    validationErrors: ValidationError[] = []
    pendingValidation: Promise<any> = Promise.resolve()

    get context (): Record<string, any> {
        return Object.defineProperty({
            id: this.id || this.defaultId,
            name: this.nameOrFallback,
            blurHandler: this.blurHandler.bind(this),
            errors: this.explicitErrors,
            allErrors: this.allErrors,
            performValidation: this.performValidation.bind(this),
            validationErrors: this.validationErrors,
            value: this.value,
        }, 'model', {
            get: this.modelGetter.bind(this),
            set: this.modelSetter.bind(this),
        })
    }

    get parsedValidationRules (): Record<string, ValidationRule> {
        const parsedValidationRules: Record<string, ValidationRule> = {}
        Object.keys(this.validationRules).forEach(key => {
            parsedValidationRules[snakeToCamel(key)] = this.validationRules[key]
        })
        return parsedValidationRules
    }

    get messages (): Record<string, any> {
        const messages: Record<string, any> = {}
        Object.keys(this.validationMessages).forEach((key) => {
            messages[snakeToCamel(key)] = this.validationMessages[key]
        })
        return messages
    }

    /**
     * Return the element’s name, or select a fallback.
     */
    get nameOrFallback (): string {
        return this.path !== '' ? `${this.path}.${this.name}` : this.name
    }

    /**
     * Does this computed property have errors
     */
    get hasErrors (): boolean {
        return this.allErrors.length > 0
    }

    /**
     * The merged errors computed property.
     * Each error is an object with fields message (translated message), rule (rule name) and context
     */
    get allErrors (): ValidationError[] {
        return [
            ...this.explicitErrors.map(message => ({ message })),
            ...arrayify(this.validationErrors)
        ]
    }

    /**
     * These are errors we that have been explicitly passed to us.
     */
    get explicitErrors (): string[] {
        return [...arrayify(this.errors), ...this.localErrors]
    }

    /**
     * Determines if this formulario element is v-modeled or not.
     */
    get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'formularioValue')
    }

    @Watch('proxy')
    onProxyChanged (newValue: Record<string, any>, oldValue: Record<string, any>): void {
        if (this.errorBehavior === ERROR_BEHAVIOR.LIVE) {
            this.performValidation()
        } else {
            this.validationErrors = []
        }
        if (!this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    @Watch('formularioValue')
    onFormularioValueChanged (newValue: Record<string, any>, oldValue: Record<string, any>): void {
        if (this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    created (): void {
        this.applyInitialValue()
        if (this.formularioRegister && typeof this.formularioRegister === 'function') {
            this.formularioRegister(this.nameOrFallback, this)
        }
        if (!this.disableErrors && typeof this.addErrorObserver === 'function') {
            this.addErrorObserver({ callback: this.setErrors, type: 'input', field: this.nameOrFallback })
        }
        if (this.errorBehavior === ERROR_BEHAVIOR.LIVE) {
            this.performValidation()
        }
    }

    // noinspection JSUnusedGlobalSymbols
    beforeDestroy (): void {
        if (!this.disableErrors && typeof this.removeErrorObserver === 'function') {
            this.removeErrorObserver(this.setErrors)
        }
        if (typeof this.formularioDeregister === 'function') {
            this.formularioDeregister(this.nameOrFallback)
        }
    }

    /**
     * Get the value from a model.
     */
    modelGetter (): any {
        const model = this.hasModel ? 'formularioValue' : 'proxy'
        if (this[model] === undefined) {
            return ''
        }
        return this[model]
    }

    /**
     * Set the value from a model.
     */
    modelSetter (value: any): void {
        if (!shallowEqualObjects(value, this.proxy)) {
            this.proxy = value
        }
        this.$emit('input', value)
        if (this.context.name && typeof this.formularioSetter === 'function') {
            this.formularioSetter(this.context.name, value)
        }
    }

    /**
     * Bound into the context object.
     */
    blurHandler (): void {
        this.$emit('blur')
        if (this.errorBehavior === ERROR_BEHAVIOR.BLUR) {
            this.performValidation()
        }
    }

    getInitialValue (): any {
        if (has(this.$options.propsData as Record<string, any>, 'value')) {
            return this.value
        } else if (has(this.$options.propsData as Record<string, any>, 'formularioValue')) {
            return this.formularioValue
        }
        return ''
    }

    applyInitialValue (): void {
        // This should only be run immediately on created and ensures that the
        // proxy and the model are both the same before any additional registration.
        if (!shallowEqualObjects(this.context.model, this.proxy)) {
            this.context.model = this.proxy
        }
    }

    performValidation (): Promise<void> {
        this.pendingValidation = this.validate().then(errors => {
            this.didValidate(errors)
        })
        return this.pendingValidation
    }

    applyValidator (validator: Validator): Promise<ValidationError|false> {
        return validate(validator, {
            value: this.context.model,
            name: this.context.name,
            getFormValues: this.getFormValues.bind(this),
        }).then(valid => valid ? false : this.getMessageObject(validator.name, validator.args))
    }

    applyValidatorGroup (group: ValidatorGroup): Promise<ValidationError[]> {
        return Promise.all(group.validators.map(this.applyValidator))
            .then(violations => (violations.filter(v => v !== false) as ValidationError[]))
    }

    validate (): Promise<ValidationError[]> {
        return new Promise(resolve => {
            const resolveGroups = (groups: ValidatorGroup[], all: ValidationError[] = []): void => {
                if (groups.length) {
                    const current = groups.shift() as ValidatorGroup

                    this.applyValidatorGroup(current).then(violations => {
                        // The rule passed or its a non-bailing group, and there are additional groups to check, continue
                        if ((violations.length === 0 || !current.bail) && groups.length) {
                            return resolveGroups(groups, all.concat(violations))
                        }
                        return resolve(all.concat(violations))
                    })
                } else {
                    resolve([])
                }
            }
            resolveGroups(createValidatorGroups(
                parseRules(this.validation, this.$formulario.rules(this.parsedValidationRules))
            ))
        })
    }

    didValidate (violations: ValidationError[]): void {
        const validationChanged = !shallowEqualObjects(violations, this.validationErrors)
        this.validationErrors = violations
        if (validationChanged) {
            const errorBag = {
                name: this.context.name,
                errors: this.validationErrors,
            }
            this.$emit('validation', errorBag)
            if (this.onFormularioFieldValidation && typeof this.onFormularioFieldValidation === 'function') {
                this.onFormularioFieldValidation(errorBag)
            }
        }
    }

    getMessageObject (ruleName: string | undefined, args: any[]): ValidationError {
        const context = {
            args,
            name: this.name,
            value: this.context.model,
            formValues: this.getFormValues(),
        }
        const message = this.getMessageFunc(ruleName || '')(context)

        return {
            rule: ruleName,
            context,
            message,
        }
    }

    getMessageFunc (ruleName: string): Function {
        ruleName = snakeToCamel(ruleName)
        if (this.messages && typeof this.messages[ruleName] !== 'undefined') {
            switch (typeof this.messages[ruleName]) {
                case 'function':
                    return this.messages[ruleName]
                case 'string':
                case 'boolean':
                    return (): string => this.messages[ruleName]
            }
        }
        return (context: ValidationContext): string => this.$formulario.validationMessage(ruleName, context, this)
    }

    hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.pendingValidation.then(() => resolve(!!this.validationErrors.length))
            })
        })
    }

    setErrors (errors: string[]): void {
        this.localErrors = arrayify(errors)
    }

    resetValidation (): void {
        this.localErrors = []
        this.validationErrors = []
    }
}
</script>
