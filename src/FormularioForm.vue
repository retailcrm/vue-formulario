<template>
    <form
        :class="classes"
        @submit.prevent="formSubmitted"
    >
        <slot :errors="mergedFormErrors" />
    </form>
</template>

<script lang="ts">
import Vue from 'vue'
import {
    Component,
    Model,
    Prop,
    Provide,
    Watch,
} from 'vue-property-decorator'
import { arrayify, getNested, has, setNested, shallowEqualObjects } from '@/libs/utils'
import { ObjectType } from '@/common.types'
import Registry from '@/libs/registry'
import FormSubmission from '@/FormSubmission'
import FormularioInput from '@/FormularioInput.vue'

@Component
export default class FormularioForm extends Vue {
    @Provide() formularioFieldValidation (errorObject) {
        return this.$emit('validation', errorObject)
    }

    @Provide() formularioRegister = this.register
    @Provide() formularioDeregister = this.deregister
    @Provide() formularioSetter = this.setFieldValue
    @Provide() getFormValues = () => this.proxy
    @Provide() observeErrors = this.addErrorObserver
    @Provide() path: string = ''

    @Provide() removeErrorObserver (observer) {
        this.errorObservers = this.errorObservers.filter(obs => obs.callback !== observer)
    }

    @Model('input', {
        type: Object,
        default: () => ({})
    }) readonly formularioValue!: Object

    @Prop({
        type: [String, Boolean],
        default: false
    }) public readonly name!: string | boolean

    @Prop({
        type: [Object, Boolean],
        default: false
    }) readonly values!: Object | Boolean

    @Prop({
        type: [Object, Boolean],
        default: false
    }) readonly errors!: Object | Boolean

    @Prop({
        type: Array,
        default: () => ([])
    }) readonly formErrors!: []

    public proxy: Object = {}

    registry: Registry = new Registry(this)

    childrenShouldShowErrors: boolean = false

    formShouldShowErrors: boolean = false

    errorObservers: [] = []

    namedErrors: [] = []

    namedFieldErrors: Object = {}

    get classes () {
        return {
            'formulario-form': true,
            [`formulario-form--${this.name}`]: !!this.name
        }
    }

    get mergedFormErrors () {
        return this.formErrors.concat(this.namedErrors)
    }

    get mergedFieldErrors () {
        const errors = {}

        if (this.errors) {
            for (const fieldName in this.errors) {
                errors[fieldName] = arrayify(this.errors[fieldName])
            }
        }

        for (const fieldName in this.namedFieldErrors) {
            errors[fieldName] = arrayify(this.namedFieldErrors[fieldName])
        }

        return errors
    }

    get hasFormErrorObservers () {
        return this.errorObservers.some(o => o.type === 'form')
    }

    get hasInitialValue () {
        return (
            (this.formularioValue && typeof this.formularioValue === 'object') ||
            (this.values && typeof this.values === 'object') ||
            (this.isGrouping && typeof this.context.model[this.index] === 'object')
        )
    }

    get isVmodeled () {
        return !!(Object.prototype.hasOwnProperty.call(this.$options.propsData, 'formularioValue') &&
            this._events &&
            Array.isArray(this._events.input) &&
            this._events.input.length)
    }

    get initialValues () {
        if (
            has(this.$options.propsData, 'formularioValue') &&
            typeof this.formularioValue === 'object'
        ) {
            // If there is a v-model on the form/group, use those values as first priority
            return Object.assign({}, this.formularioValue) // @todo - use a deep clone to detach reference types
        } else if (
            has(this.$options.propsData, 'values') &&
            typeof this.values === 'object'
        ) {
            // If there are values, use them as secondary priority
            return Object.assign({}, this.values)
        } else if (
            this.isGrouping && typeof this.context.model[this.index] === 'object'
        ) {
            return this.context.model[this.index]
        }
        return {}
    }

    @Watch('formularioValue', { deep: true })
    onFormularioValueChanged (values) {
        if (this.isVmodeled && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('mergedFormErrors')
    onMergedFormErrorsChanged (errors) {
        this.errorObservers
            .filter(o => o.type === 'form')
            .forEach(o => o.callback(errors))
    }

    @Watch('mergedFieldErrors', { immediate: true })
    onMergedFieldErrorsChanged (errors) {
        this.errorObservers
            .filter(o => o.type === 'input')
            .forEach(o => o.callback(errors[o.field] || []))
    }

    created () {
        this.$formulario.register(this)
        this.applyInitialValues()
    }

    destroyed () {
        this.$formulario.deregister(this)
    }

    public register (field: string, component: FormularioInput) {
        this.registry.register(field, component)
    }

    public deregister (field: string) {
        this.registry.remove(field)
    }

    applyErrors ({ formErrors, inputErrors }) {
        // given an object of errors, apply them to this form
        this.namedErrors = formErrors
        this.namedFieldErrors = inputErrors
    }

    addErrorObserver (observer) {
        if (!this.errorObservers.find(obs => observer.callback === obs.callback)) {
            this.errorObservers.push(observer)
            if (observer.type === 'form') {
                observer.callback(this.mergedFormErrors)
            } else if (has(this.mergedFieldErrors, observer.field)) {
                observer.callback(this.mergedFieldErrors[observer.field])
            }
        }
    }

    registerErrorComponent (component) {
        if (!this.errorComponents.includes(component)) {
            this.errorComponents.push(component)
        }
    }

    formSubmitted () {
        // perform validation here
        this.showErrors()
        const submission = new FormSubmission(this)
        this.$emit('submit-raw', submission)
        return submission.hasValidationErrors()
            .then(hasErrors => hasErrors ? undefined : submission.values())
            .then(data => {
                if (typeof data !== 'undefined') {
                    this.$emit('submit', data)
                    return data
                }
                return undefined
            })
    }

    applyInitialValues () {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    setFieldValue (field, value) {
        if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: value, ...proxy } = this.proxy
            this.proxy = proxy
        } else {
            setNested(this.proxy, field, value)
        }
        this.$emit('input', Object.assign({}, this.proxy))
    }

    hasValidationErrors () {
        return Promise.all(this.registry.reduce((resolvers, cmp) => {
            resolvers.push(cmp.performValidation() && cmp.getValidationErrors())
            return resolvers
        }, [])).then(errorObjects => errorObjects.some(item => item.hasErrors))
    }

    showErrors () {
        this.childrenShouldShowErrors = true
        this.registry.map(input => {
            input.formShouldShowErrors = true
        })
    }

    hideErrors () {
        this.childrenShouldShowErrors = false
        this.registry.map(input => {
            input.formShouldShowErrors = false
            input.behavioralErrorVisibility = false
        })
    }

    setValues (values: ObjectType) {
        // Collect all keys, existing and incoming
        const keys = Array.from(new Set(Object.keys(values).concat(Object.keys(this.proxy))))
        keys.forEach(field => {
            const fieldComponent = this.registry.get(field) as FormularioInput

            if (this.registry.has(field) &&
                !shallowEqualObjects(getNested(values, field), getNested(this.proxy, field)) &&
                !shallowEqualObjects(getNested(values, field), fieldComponent.proxy)
            ) {
                this.setFieldValue(field, getNested(values, field))
                this.registry.get(field).context.model = getNested(values, field)
            }
        })
        this.applyInitialValues()
    }
}
</script>
