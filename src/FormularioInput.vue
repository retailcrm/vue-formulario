<template>
    <div
        class="formulario-input"
        :data-has-errors="hasErrors"
        :data-is-showing-errors="hasVisibleErrors"
        :data-type="type"
    >
        <slot :id="id" :context="context" :errors="errors" :validationErrors="validationErrors" />
    </div>
</template>

<script>
import context from './libs/context'
import { shallowEqualObjects, parseRules, snakeToCamel, has, arrayify, groupBails } from './libs/utils'

export default {
    name: 'FormularioInput',
    inheritAttrs: false,
    provide () {
        return {
            // Allows sub-components of this input to register arbitrary rules.
            formularioRegisterRule: this.registerRule,
            formularioRemoveRule: this.removeRule
        }
    },
    inject: {
        formularioSetter: { default: undefined },
        formularioFieldValidation: { default: () => () => ({}) },
        formularioRegister: { default: undefined },
        formularioDeregister: { default: undefined },
        getFormValues: { default: () => () => ({}) },
        observeErrors: { default: undefined },
        removeErrorObserver: { default: undefined },
        path: { default: '' }
    },
    model: {
        prop: 'formularioValue',
        event: 'input'
    },
    props: {
        type: {
            type: String,
            default: 'text'
        },
        name: {
            type: String,
            required: true
        },
        /* eslint-disable */
        formularioValue: {
            default: ''
        },
        value: {
            default: false
        },
        /* eslint-enable */
        id: {
            type: [String, Boolean, Number],
            default: false
        },
        errors: {
            type: [String, Array, Boolean],
            default: false
        },
        validation: {
            type: [String, Boolean, Array],
            default: false
        },
        validationName: {
            type: [String, Boolean],
            default: false
        },
        errorBehavior: {
            type: String,
            default: 'blur',
            validator: function (value) {
                return ['blur', 'live', 'submit'].includes(value)
            }
        },
        showErrors: {
            type: Boolean,
            default: false
        },
        imageBehavior: {
            type: String,
            default: 'preview'
        },
        uploadUrl: {
            type: [String, Boolean],
            default: false
        },
        uploader: {
            type: [Function, Object, Boolean],
            default: false
        },
        uploadBehavior: {
            type: String,
            default: 'live'
        },
        preventWindowDrops: {
            type: Boolean,
            default: true
        },
        validationMessages: {
            type: Object,
            default: () => ({})
        },
        validationRules: {
            type: Object,
            default: () => ({})
        },
        disableErrors: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            defaultId: this.$formulario.nextId(this),
            localAttributes: {},
            localErrors: [],
            proxy: this.getInitialValue(),
            behavioralErrorVisibility: (this.errorBehavior === 'live'),
            formShouldShowErrors: false,
            validationErrors: [],
            pendingValidation: Promise.resolve(),
            // These registries are used for injected messages registrants only (mostly internal).
            ruleRegistry: [],
            messageRegistry: {}
        }
    },
    computed: {
        ...context,
        parsedValidationRules () {
            const parsedValidationRules = {}
            Object.keys(this.validationRules).forEach(key => {
                parsedValidationRules[snakeToCamel(key)] = this.validationRules[key]
            })
            return parsedValidationRules
        },
        messages () {
            const messages = {}
            Object.keys(this.validationMessages).forEach((key) => {
                messages[snakeToCamel(key)] = this.validationMessages[key]
            })
            Object.keys(this.messageRegistry).forEach((key) => {
                messages[snakeToCamel(key)] = this.messageRegistry[key]
            })
            return messages
        }
    },
    watch: {
        '$attrs': {
            handler (value) {
                this.updateLocalAttributes(value)
            },
            deep: true
        },
        proxy (newValue, oldValue) {
            this.performValidation()
            if (!this.isVmodeled && !shallowEqualObjects(newValue, oldValue)) {
                this.context.model = newValue
            }
        },
        formularioValue (newValue, oldValue) {
            if (this.isVmodeled && !shallowEqualObjects(newValue, oldValue)) {
                this.context.model = newValue
            }
        },
        showValidationErrors: {
            handler (val) {
                this.$emit('error-visibility', val)
            },
            immediate: true
        }
    },
    created () {
        this.applyInitialValue()
        if (this.formularioRegister && typeof this.formularioRegister === 'function') {
            this.formularioRegister(this.nameOrFallback, this)
        }
        if (!this.disableErrors && typeof this.observeErrors === 'function') {
            this.observeErrors({ callback: this.setErrors, type: 'input', field: this.nameOrFallback })
        }
        this.updateLocalAttributes(this.$attrs)
        this.performValidation()
    },
    beforeDestroy () {
        if (!this.disableErrors && typeof this.removeErrorObserver === 'function') {
            this.removeErrorObserver(this.setErrors)
        }
        if (typeof this.formularioDeregister === 'function') {
            this.formularioDeregister(this.nameOrFallback)
        }
    },
    methods: {
        getInitialValue () {
            if (has(this.$options.propsData, 'value')) {
                return this.value
            } else if (has(this.$options.propsData, 'formularioValue')) {
                return this.formularioValue
            }
            return ''
        },
        applyInitialValue () {
            // This should only be run immediately on created and ensures that the
            // proxy and the model are both the same before any additional registration.
            if (!shallowEqualObjects(this.context.model, this.proxy)) {
                this.context.model = this.proxy
            }
        },
        updateLocalAttributes (value) {
            if (!shallowEqualObjects(value, this.localAttributes)) {
                this.localAttributes = value
            }
        },
        performValidation () {
            let rules = parseRules(this.validation, this.$formulario.rules(this.parsedValidationRules))
            // Add in ruleRegistry rules. These are added directly via injection from
            // children and not part of the standard validation rule set.
            rules = this.ruleRegistry.length ? this.ruleRegistry.concat(rules) : rules
            this.pendingValidation = this.runRules(rules)
                .then(messages => this.didValidate(messages))
            return this.pendingValidation
        },
        runRules (rules) {
            const run = ([rule, args, ruleName, modifier]) => {
                var res = rule({
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
        },
        didValidate (messages) {
            const validationChanged = !shallowEqualObjects(messages, this.validationErrors)
            this.validationErrors = messages
            if (validationChanged) {
                const errorObject = this.getErrorObject()
                this.$emit('validation', errorObject)
                if (this.formularioFieldValidation && typeof this.formularioFieldValidation === 'function') {
                    this.formularioFieldValidation(errorObject)
                }
            }
        },
        getMessageObject (ruleName, args) {
            let context = {
                args,
                name: this.mergedValidationName,
                value: this.context.model,
                vm: this,
                formValues: this.getFormValues()
            };
            let message = this.getMessageFunc(ruleName)(context);

            return {
                message: message,
                rule: ruleName,
                context: context
            }
        },
        getMessageFunc (ruleName) {
            ruleName = snakeToCamel(ruleName)
            if (this.messages && typeof this.messages[ruleName] !== 'undefined') {
                switch (typeof this.messages[ruleName]) {
                    case 'function':
                        return this.messages[ruleName]
                    case 'string':
                    case 'boolean':
                        return () => this.messages[ruleName]
                }
            }
            return (context) => this.$formulario.validationMessage(ruleName, context, this)
        },
        hasValidationErrors () {
            return new Promise(resolve => {
                this.$nextTick(() => {
                    this.pendingValidation.then(() => resolve(!!this.validationErrors.length))
                })
            })
        },
        getValidationErrors () {
            return new Promise(resolve => {
                this.$nextTick(() => this.pendingValidation.then(() => resolve(this.getErrorObject())))
            })
        },
        getErrorObject () {
            return {
                name: this.context.nameOrFallback || this.context.name,
                errors: this.validationErrors.filter(s => typeof s === 'object'),
                hasErrors: !!this.validationErrors.length
            }
        },
        setErrors (errors) {
            this.localErrors = arrayify(errors)
        },
        registerRule (rule, args, ruleName, message = null) {
            if (!this.ruleRegistry.some(r => r[2] === ruleName)) {
                // These are the raw rule format since they will be used directly.
                this.ruleRegistry.push([rule, args, ruleName])
                if (message !== null) {
                    this.messageRegistry[ruleName] = message
                }
            }
        },
        removeRule (key) {
            const ruleIndex = this.ruleRegistry.findIndex(r => r[2] === key)
            if (ruleIndex >= 0) {
                this.ruleRegistry.splice(ruleIndex, 1)
                delete this.messageRegistry[key]
            }
        }
    }
}
</script>
