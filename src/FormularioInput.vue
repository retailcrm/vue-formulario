<template>
    <div
        class="formulario-input"
        :data-has-errors="hasErrors"
        :data-is-showing-errors="hasVisibleErrors"
        :data-type="type"
    >
        <slot
            :id="id"
            :context="context"
            :errors="errors"
            :validationErrors="validationErrors"
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
import { shallowEqualObjects, parseRules, snakeToCamel, has, arrayify } from './libs/utils'
import {
    ValidationContext,
    ValidationError,
    ValidationErrorBag,
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
    @Inject({ default: () => (): void => {} }) formularioFieldValidation!: Function
    @Inject({ default: undefined }) formularioRegister!: Function|undefined
    @Inject({ default: undefined }) formularioDeregister!: Function|undefined
    @Inject({ default: () => (): Record<string, any> => ({}) }) getFormValues!: Function
    @Inject({ default: undefined }) addErrorObserver!: Function|undefined
    @Inject({ default: undefined }) removeErrorObserver!: Function|undefined
    @Inject({ default: '' }) path!: string

    @Model('input', { default: '' }) formularioValue: any

    @Prop({
        type: [String, Number, Boolean],
        default: false,
    }) id!: string|number|boolean

    @Prop({ default: 'text' }) type!: string
    @Prop({ required: true }) name!: string
    @Prop({ default: false }) value!: any

    @Prop({
        default: '',
    }) validation!: string|any[]

    @Prop({
        type: Object,
        default: () => ({}),
    }) validationRules!: Record<string, ValidationRule>

    @Prop({
        type: Object,
        default: () => ({}),
    }) validationMessages!: Record<string, any>

    @Prop({ default: () => [] }) errors!: string[]

    @Prop({
        type: String,
        default: ERROR_BEHAVIOR.BLUR,
        validator: value => [ERROR_BEHAVIOR.BLUR, ERROR_BEHAVIOR.LIVE, ERROR_BEHAVIOR.SUBMIT].includes(value)
    }) errorBehavior!: string

    @Prop({ default: false }) showErrors!: boolean
    @Prop({ default: false }) disableErrors!: boolean
    @Prop({ default: true }) preventWindowDrops!: boolean
    @Prop({ default: 'preview' }) imageBehavior!: string
    @Prop({ default: false }) uploader!: Function|Record<string, any>|boolean
    @Prop({ default: false }) uploadUrl!: string|boolean
    @Prop({ default: 'live' }) uploadBehavior!: string

    defaultId: string = this.$formulario.nextId(this)
    localErrors: string[] = []
    proxy: Record<string, any> = this.getInitialValue()
    behavioralErrorVisibility: boolean = this.errorBehavior === 'live'
    formShouldShowErrors = false
    validationErrors: ValidationError[] = []
    pendingValidation: Promise<any> = Promise.resolve()

    get context (): Record<string, any> {
        return this.defineModel({
            id: this.id || this.defaultId,
            name: this.nameOrFallback,
            blurHandler: this.blurHandler.bind(this),
            errors: this.explicitErrors,
            allErrors: this.allErrors,
            formShouldShowErrors: this.formShouldShowErrors,
            imageBehavior: this.imageBehavior,
            performValidation: this.performValidation.bind(this),
            showValidationErrors: this.showValidationErrors,
            uploader: this.uploader || this.$formulario.getUploader(),
            validationErrors: this.validationErrors,
            value: this.value,
            visibleValidationErrors: this.visibleValidationErrors,
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
     * Returns if form has actively visible errors (of any kind)
     */
    get hasVisibleErrors (): boolean {
        return (this.validationErrors && this.showValidationErrors) || this.explicitErrors.length > 0
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
     * All of the currently visible validation errors (does not include error handling)
     */
    get visibleValidationErrors (): ValidationError[] {
        return (this.showValidationErrors && this.validationErrors.length) ? this.validationErrors : []
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

    /**
     * Determines if the field should show it's error (if it has one)
     */
    get showValidationErrors (): boolean {
        return this.showErrors || this.formShouldShowErrors || this.behavioralErrorVisibility
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

    @Watch('showValidationErrors', { immediate: true })
    onShowValidationErrorsChanged (val: boolean): void {
        this.$emit('error-visibility', val)
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
     * Defines the model used throughout the existing context.
     */
    defineModel (context: Record<string, any>): Record<string, any> {
        return Object.defineProperty(context, 'model', {
            get: this.modelGetter.bind(this),
            set: this.modelSetter.bind(this),
        })
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
        if (this.errorBehavior === 'blur') {
            this.behavioralErrorVisibility = true
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

    get validators (): any {
        return createValidatorGroups(
            parseRules(this.validation, this.$formulario.rules(this.parsedValidationRules))
        )
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
            resolveGroups(this.validators)
        })
    }

    didValidate (violations: ValidationError[]): void {
        const validationChanged = !shallowEqualObjects(violations, this.validationErrors)
        this.validationErrors = violations
        if (validationChanged) {
            const errorBag = this.getErrorObject()
            this.$emit('validation', errorBag)
            if (this.formularioFieldValidation && typeof this.formularioFieldValidation === 'function') {
                this.formularioFieldValidation(errorBag)
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

    getErrorObject (): ValidationErrorBag {
        return {
            name: this.context.nameOrFallback || this.context.name,
            errors: this.validationErrors.filter(s => typeof s === 'object'),
            hasErrors: !!this.validationErrors.length
        }
    }

    setErrors (errors: string[]): void {
        this.localErrors = arrayify(errors)
    }
}
</script>
