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
    Provide,
    Watch,
} from 'vue-property-decorator'
import { shallowEqualObjects, parseRules, snakeToCamel, has, arrayify, groupBails } from './libs/utils'
import { ValidationError } from '@/validation/types'

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

    @Provide() formularioRegisterRule = this.registerRule
    @Provide() formularioRemoveRule = this.removeRule

    @Model('input', {
        default: '',
    }) formularioValue: any

    @Prop({
        type: [String, Number, Boolean],
        default: false,
    }) id!: string|number|boolean

    @Prop({ default: 'text' }) type!: string
    @Prop({ required: true }) name!: string|boolean
    @Prop({ default: false }) value!: any

    @Prop({
        type: [String, Boolean, Array],
        default: false,
    }) validation!: string|any[]|boolean

    @Prop({
        type: [String, Boolean],
        default: false,
    }) validationName!: string|boolean

    @Prop({
        type: Object,
        default: () => ({}),
    }) validationRules!: Record<string, any>

    @Prop({
        type: Object,
        default: () => ({}),
    }) validationMessages!: Record<string, any>

    @Prop({
        type: [Array, String, Boolean],
        default: false,
    }) errors!: []|string|boolean

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
    localAttributes: Record<string, any> = {}
    localErrors: ValidationError[] = []
    proxy: Record<string, any> = this.getInitialValue()
    behavioralErrorVisibility: boolean = this.errorBehavior === 'live'
    formShouldShowErrors = false
    validationErrors: [] = []
    pendingValidation: Promise<any> = Promise.resolve()
    // These registries are used for injected messages registrants only (mostly internal).
    ruleRegistry: [] = []
    messageRegistry: Record<string, any> = {}

    get context (): Record<string, any> {
        return this.defineModel({
            id: this.id || this.defaultId,
            name: this.nameOrFallback,
            attributes: this.elementAttributes,
            blurHandler: this.blurHandler.bind(this),
            disableErrors: this.disableErrors,
            errors: this.explicitErrors,
            allErrors: this.allErrors,
            formShouldShowErrors: this.formShouldShowErrors,
            getValidationErrors: this.getValidationErrors.bind(this),
            hasGivenName: this.hasGivenName,
            hasValidationErrors: this.hasValidationErrors.bind(this),
            imageBehavior: this.imageBehavior,
            performValidation: this.performValidation.bind(this),
            preventWindowDrops: this.preventWindowDrops,
            setErrors: this.setErrors.bind(this),
            showValidationErrors: this.showValidationErrors,
            uploadBehavior: this.uploadBehavior,
            uploadUrl: this.mergedUploadUrl,
            uploader: this.uploader || this.$formulario.getUploader(),
            validationErrors: this.validationErrors,
            value: this.value,
            visibleValidationErrors: this.visibleValidationErrors,
        })
    }

    get parsedValidationRules () {
        const parsedValidationRules = {}
        Object.keys(this.validationRules).forEach(key => {
            parsedValidationRules[snakeToCamel(key)] = this.validationRules[key]
        })
        return parsedValidationRules
    }

    get messages (): Record<string, any> {
        const messages = {}
        Object.keys(this.validationMessages).forEach((key) => {
            messages[snakeToCamel(key)] = this.validationMessages[key]
        })
        Object.keys(this.messageRegistry).forEach((key) => {
            messages[snakeToCamel(key)] = this.messageRegistry[key]
        })
        return messages
    }

    /**
     * Reducer for attributes that will be applied to each core input element.
     */
    get elementAttributes (): Record<string, any> {
        const attrs = Object.assign({}, this.localAttributes)
        // pass the ID prop through to the root element
        if (this.id) {
            attrs.id = this.id
        } else {
            attrs.id = this.defaultId
        }
        // pass an explicitly given name prop through to the root element
        if (this.hasGivenName) {
            attrs.name = this.name
        }

        // If there is help text, have this element be described by it.
        if (this.help) {
            attrs['aria-describedby'] = `${attrs.id}-help`
        }

        return attrs
    }

    /**
     * Return the element’s name, or select a fallback.
     */
    get nameOrFallback (): string {
        return this.path !== '' ? `${this.path}.${this.name}` : this.name
    }

    /**
     * Determine if an input has a user-defined name.
     */
    get hasGivenName (): boolean {
        return typeof this.name !== 'boolean'
    }

    /**
     * The validation label to use.
     */
    get mergedValidationName (): string {
        return this.validationName || this.name
    }

    /**
     * Use the uploadURL on the input if it exists, otherwise use the uploadURL
     * that is defined as a plugin option.
     */
    get mergedUploadUrl (): string | boolean {
        return this.uploadUrl || this.$formulario.getUploadUrl()
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
        return ((this.validationErrors && this.showValidationErrors) || !!this.explicitErrors.length)
    }

    /**
     * The merged errors computed property.
     * Each error is an object with fields message (translated message), rule (rule name) and context
     */
    get allErrors (): ValidationError[] {
        return [
            ...this.explicitErrors,
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
     * These are errors we that have been explicity passed to us.
     */
    get explicitErrors (): ValidationError[] {
        return [
            ...arrayify(this.errors),
            ...this.localErrors,
        ].map(message => ({ rule: null, context: null, message }))
    }

    /**
     * Determines if this formulario element is v-modeled or not.
     */
    get isVmodeled (): boolean {
        return !!(Object.prototype.hasOwnProperty.call(this.$options.propsData, 'formularioValue') &&
            this._events &&
            Array.isArray(this._events.input) &&
            this._events.input.length)
    }

    /**
     * Determines if the field should show it's error (if it has one)
     */
    get showValidationErrors (): boolean {
        return this.showErrors || this.formShouldShowErrors || this.behavioralErrorVisibility
    }

    @Watch('$attrs', { deep: true })
    onAttrsChanged (value): void {
        this.updateLocalAttributes(value)
    }

    @Watch('proxy')
    onProxyChanged (newValue, oldValue): void {
        if (this.errorBehavior === ERROR_BEHAVIOR.LIVE) {
            this.performValidation()
        } else {
            this.validationErrors = []
        }
        if (!this.isVmodeled && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    @Watch('formularioValue')
    onFormularioValueChanged (newValue, oldValue): void {
        if (this.isVmodeled && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue
        }
    }

    @Watch('showValidationErrors', { immediate: true })
    onShowValidationErrorsChanged (val): void {
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
        this.updateLocalAttributes(this.$attrs)
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
    defineModel (context): Record<string, any> {
        return Object.defineProperty(context, 'model', {
            get: this.modelGetter.bind(this),
            set: this.modelSetter.bind(this),
        })
    }

    /**
     * Get the value from a model.
     */
    modelGetter (): any {
        const model = this.isVmodeled ? 'formularioValue' : 'proxy'
        if (this[model] === undefined) {
            return ''
        }
        return this[model]
    }

    /**
     * Set the value from a model.
     */
    modelSetter (value): void {
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

    updateLocalAttributes (value): void {
        if (!shallowEqualObjects(value, this.localAttributes)) {
            this.localAttributes = value
        }
    }

    performValidation () {
        let rules = parseRules(this.validation, this.$formulario.rules(this.parsedValidationRules))
        // Add in ruleRegistry rules. These are added directly via injection from
        // children and not part of the standard validation rule set.
        rules = this.ruleRegistry.length ? this.ruleRegistry.concat(rules) : rules
        this.pendingValidation = this.runRules(rules)
            .then(messages => this.didValidate(messages))
        return this.pendingValidation
    }

    runRules (rules) {
        const run = ([rule, args, ruleName]) => {
            let res = rule({
                value: this.context.model,
                getFormValues: this.getFormValues.bind(this),
                name: this.context.name
            }, ...args)
            res = (res instanceof Promise) ? res : Promise.resolve(res)
            return res.then(result => result ? false : this.getMessageObject(ruleName, args))
        }

        return new Promise(resolve => {
            const resolveGroups = (groups, allMessages = []) => {
                const ruleGroup = groups.shift()
                if (Array.isArray(ruleGroup) && ruleGroup.length) {
                    Promise.all(ruleGroup.map(run))
                        .then(messages => messages.filter(m => !!m))
                        .then(messages => {
                            messages = Array.isArray(messages) ? messages : []
                            // The rule passed or its a non-bailing group, and there are additional groups to check, continue
                            if ((!messages.length || !ruleGroup.bail) && groups.length) {
                                return resolveGroups(groups, allMessages.concat(messages))
                            }
                            return resolve(allMessages.concat(messages))
                        })
                } else {
                    resolve([])
                }
            }
            resolveGroups(groupBails(rules))
        })
    }

    didValidate (messages): void {
        const validationChanged = !shallowEqualObjects(messages, this.validationErrors)
        this.validationErrors = messages
        if (validationChanged) {
            const errorObject = this.getErrorObject()
            this.$emit('validation', errorObject)
            if (this.formularioFieldValidation && typeof this.formularioFieldValidation === 'function') {
                this.formularioFieldValidation(errorObject)
            }
        }
    }

    getMessageObject (ruleName, args) {
        const context = {
            args,
            name: this.mergedValidationName,
            value: this.context.model,
            vm: this,
            formValues: this.getFormValues()
        }
        const message = this.getMessageFunc(ruleName)(context)

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
        return (context): string => this.$formulario.validationMessage(ruleName, context, this)
    }

    hasValidationErrors (): Promise<boolean> {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.pendingValidation.then(() => resolve(!!this.validationErrors.length))
            })
        })
    }

    getValidationErrors () {
        return new Promise(resolve => {
            this.$nextTick(() => this.pendingValidation.then(() => resolve(this.getErrorObject())))
        })
    }

    getErrorObject () {
        return {
            name: this.context.nameOrFallback || this.context.name,
            errors: this.validationErrors.filter(s => typeof s === 'object'),
            hasErrors: !!this.validationErrors.length
        }
    }

    setErrors (errors): void {
        this.localErrors = arrayify(errors)
    }

    registerRule (rule, args, ruleName, message = null): void {
        if (!this.ruleRegistry.some(r => r[2] === ruleName)) {
            // These are the raw rule format since they will be used directly.
            this.ruleRegistry.push([rule, args, ruleName])
            if (message !== null) {
                this.messageRegistry[ruleName] = message
            }
        }
    }

    removeRule (key): void {
        const ruleIndex = this.ruleRegistry.findIndex(r => r[2] === key)
        if (ruleIndex >= 0) {
            this.ruleRegistry.splice(ruleIndex, 1)
            delete this.messageRegistry[key]
        }
    }
}
</script>
