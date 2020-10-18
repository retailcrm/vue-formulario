<template>
    <form @submit.prevent="formSubmitted">
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
import Registry from '@/libs/registry'
import FormSubmission from '@/FormSubmission'
import FormularioInput from '@/FormularioInput.vue'

@Component
export default class FormularioForm extends Vue {
    @Provide() formularioFieldValidation (errorObject): void {
        this.$emit('validation', errorObject)
    }

    @Provide() formularioRegister = this.register
    @Provide() formularioDeregister = this.deregister
    @Provide() formularioSetter = this.setFieldValue
    @Provide() getFormValues = (): Record<string, any> => this.proxy
    @Provide() path = ''

    @Provide() removeErrorObserver (observer): void {
        this.errorObservers = this.errorObservers.filter(obs => obs.callback !== observer)
    }

    @Model('input', {
        type: Object,
        default: () => ({})
    }) readonly formularioValue!: Record<string, any>

    @Prop({
        type: [String, Boolean],
        default: false
    }) public readonly name!: string | boolean

    @Prop({
        type: [Object, Boolean],
        default: false
    }) readonly values!: Record<string, any> | boolean

    @Prop({ default: false }) readonly errors!: Record<string, any> | boolean
    @Prop({ default: () => ([]) }) readonly formErrors!: []

    public proxy: Record<string, any> = {}

    registry: Registry = new Registry(this)

    childrenShouldShowErrors = false

    formShouldShowErrors = false

    errorObservers: [] = []

    namedErrors: [] = []

    namedFieldErrors: Record<string, any> = {}

    get mergedFormErrors (): Record<string, any> {
        return this.formErrors.concat(this.namedErrors)
    }

    get mergedFieldErrors (): Record<string, any> {
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

    get hasFormErrorObservers (): boolean {
        return this.errorObservers.some(o => o.type === 'form')
    }

    get hasInitialValue (): boolean {
        return (
            (this.formularioValue && typeof this.formularioValue === 'object') ||
            (this.values && typeof this.values === 'object') ||
            (this.isGrouping && typeof this.context.model[this.index] === 'object')
        )
    }

    get isVmodeled (): boolean {
        return !!(has(this.$options.propsData, 'formularioValue') &&
            this._events &&
            Array.isArray(this._events.input) &&
            this._events.input.length)
    }

    get initialValues (): Record<string, any> {
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
    onFormularioValueChanged (values): void {
        if (this.isVmodeled && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('mergedFormErrors')
    onMergedFormErrorsChanged (errors): void {
        this.errorObservers
            .filter(o => o.type === 'form')
            .forEach(o => o.callback(errors))
    }

    @Watch('mergedFieldErrors', { immediate: true })
    onMergedFieldErrorsChanged (errors): void {
        this.errorObservers
            .filter(o => o.type === 'input')
            .forEach(o => o.callback(errors[o.field] || []))
    }

    created (): void {
        this.$formulario.register(this)
        this.applyInitialValues()
    }

    destroyed (): void {
        this.$formulario.deregister(this)
    }

    public register (field: string, component: FormularioInput): void {
        this.registry.register(field, component)
    }

    public deregister (field: string): void {
        this.registry.remove(field)
    }

    applyErrors ({ formErrors, inputErrors }): void {
        // given an object of errors, apply them to this form
        this.namedErrors = formErrors
        this.namedFieldErrors = inputErrors
    }

    @Provide()
    addErrorObserver (observer: ErrorObserver): void {
        if (!this.errorObservers.find(obs => observer.callback === obs.callback)) {
            this.errorObservers.push(observer)
            if (observer.type === 'form') {
                observer.callback(this.mergedFormErrors)
            } else if (has(this.mergedFieldErrors, observer.field)) {
                observer.callback(this.mergedFieldErrors[observer.field])
            }
        }
    }

    registerErrorComponent (component): void {
        if (!this.errorComponents.includes(component)) {
            this.errorComponents.push(component)
        }
    }

    formSubmitted (): Promise<void> {
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
            })
    }

    applyInitialValues (): void {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    setFieldValue (field, value): void {
        if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: value, ...proxy } = this.proxy
            this.proxy = proxy
        } else {
            setNested(this.proxy, field, value)
        }
        this.$emit('input', Object.assign({}, this.proxy))
    }

    hasValidationErrors (): Promise<boolean> {
        return Promise.all(this.registry.reduce((resolvers, cmp) => {
            resolvers.push(cmp.performValidation() && cmp.getValidationErrors())
            return resolvers
        }, [])).then(errorObjects => errorObjects.some(item => item.hasErrors))
    }

    showErrors (): void {
        this.childrenShouldShowErrors = true
        this.registry.forEach((input: FormularioInput) => {
            input.formShouldShowErrors = true
        })
    }

    hideErrors (): void {
        this.childrenShouldShowErrors = false
        this.registry.forEach((input: FormularioInput) => {
            input.formShouldShowErrors = false
            input.behavioralErrorVisibility = false
        })
    }

    setValues (values: Record<string, any>): void {
        // Collect all keys, existing and incoming
        const keys = Array.from(new Set(Object.keys(values).concat(Object.keys(this.proxy))))
        keys.forEach(field => {
            if (this.registry.hasNested(field)) {
                this.registry.getNested(field).forEach((registryField, registryKey) => {
                    if (
                        !shallowEqualObjects(
                            getNested(values, registryKey),
                            getNested(this.proxy, registryKey)
                        )
                    ) {
                        this.setFieldValue(registryKey, getNested(values, registryKey))
                    }

                    if (
                        !shallowEqualObjects(
                            getNested(values, registryKey),
                            this.registry.get(registryKey).proxy
                        )
                    ) {
                        this.registry.get(registryKey).context.model = getNested(values, registryKey)
                    }
                })
            }
        })
        this.applyInitialValues()
    }
}
</script>
