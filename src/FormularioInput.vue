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
    NONE: 'none',
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
    @Prop({ default: () => ({}) }) validationRules!: Record<string, ValidationRule>
    @Prop({ default: () => ({}) }) validationMessages!: Record<string, any>
    @Prop({ default: () => [] }) errors!: string[]
    @Prop({
        default: ERROR_BEHAVIOR.BLUR,
        validator: behavior => [
            ERROR_BEHAVIOR.BLUR,
            ERROR_BEHAVIOR.LIVE,
            ERROR_BEHAVIOR.NONE,
            ERROR_BEHAVIOR.SUBMIT,
        ].includes(behavior)
    }) errorBehavior!: string

    @Prop({ default: false }) errorsDisabled!: boolean

    proxy: any = this.getInitialValue()
    localErrors: string[] = []
    violations: ValidationError[] = []
    pendingValidation: Promise<any> = Promise.resolve()

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
            // @TODO: Deprecated
            allErrors: [
                ...this.mergedErrors.map(message => ({ message })),
                ...arrayify(this.violations)
            ],
            blurHandler: this.blurHandler.bind(this),
            performValidation: this.performValidation.bind(this),
        }, 'model', {
            get: () => this.model,
            set: (value: any) => {
                this.model = value
            },
        })
    }

    get parsedValidationRules (): Record<string, ValidationRule> {
        const rules: Record<string, ValidationRule> = {}
        Object.keys(this.validationRules).forEach(key => {
            rules[snakeToCamel(key)] = this.validationRules[key]
        })
        return rules
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
    get fullQualifiedName (): string {
        return this.path !== '' ? `${this.path}.${this.name}` : this.name
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
        if (this.errorBehavior === ERROR_BEHAVIOR.LIVE) {
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
        if (this.errorBehavior === ERROR_BEHAVIOR.LIVE) {
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
        const validationChanged = !shallowEqualObjects(violations, this.violations)
        this.violations = violations
        if (validationChanged) {
            const errorBag = {
                name: this.context.name,
                errors: this.violations,
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
