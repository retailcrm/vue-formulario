<template>
    <form @submit.prevent="onFormSubmit">
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
import { arrayify, cloneDeep, getNested, has, setNested, shallowEqualObjects } from '@/libs/utils'
import Registry from '@/libs/registry'
import FormularioInput from '@/FormularioInput.vue'

import {
    ErrorHandler,
    ErrorObserver,
    ErrorObserverRegistry,
} from '@/validation/ErrorObserver'

import { ValidationErrorBag } from '@/validation/types'

import FileUpload from '@/FileUpload'

import FormularioFormInterface from '@/FormularioFormInterface'

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue implements FormularioFormInterface {
    @Provide() formularioFieldValidation (errorBag: ValidationErrorBag): void {
        this.$emit('validation', errorBag)
    }

    @Provide() getFormValues = (): Record<string, any> => this.proxy
    @Provide() path = ''

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

    @Prop({ default: () => ({}) }) readonly errors!: Record<string, any>
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    public proxy: Record<string, any> = {}

    registry: Registry = new Registry(this)

    childrenShouldShowErrors = false

    private errorObserverRegistry = new ErrorObserverRegistry()
    private localFormErrors: string[] = []
    private localFieldErrors: Record<string, string[]> = {}

    get mergedFormErrors (): string[] {
        return [...this.formErrors, ...this.localFormErrors]
    }

    get mergedFieldErrors (): Record<string, any> {
        const errors: Record<string, any> = {}

        if (this.errors) {
            for (const fieldName in this.errors) {
                errors[fieldName] = arrayify(this.errors[fieldName])
            }
        }

        for (const fieldName in this.localFieldErrors) {
            errors[fieldName] = arrayify(this.localFieldErrors[fieldName])
        }

        return errors
    }

    get hasInitialValue (): boolean {
        return (
            (this.formularioValue && typeof this.formularioValue === 'object') ||
            (this.values && typeof this.values === 'object')
        )
    }

    get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'formularioValue')
    }

    get hasValue (): boolean {
        return has(this.$options.propsData || {}, 'values')
    }

    get initialValues (): Record<string, any> {
        if (this.hasModel && typeof this.formularioValue === 'object') {
            // If there is a v-model on the form/group, use those values as first priority
            return { ...this.formularioValue } // @todo - use a deep clone to detach reference types
        }

        if (this.hasValue && typeof this.values === 'object') {
            // If there are values, use them as secondary priority
            return { ...this.values }
        }

        return {}
    }

    @Watch('formularioValue', { deep: true })
    onFormularioValueChanged (values: Record<string, any>): void {
        if (this.hasModel && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('mergedFormErrors')
    onMergedFormErrorsChanged (errors: string[]): void {
        this.errorObserverRegistry.filter(o => o.type === 'form').observe(errors)
    }

    @Watch('mergedFieldErrors', { immediate: true })
    onMergedFieldErrorsChanged (errors: Record<string, string[]>): void {
        this.errorObserverRegistry.filter(o => o.type === 'input').observe(errors)
    }

    created (): void {
        this.$formulario.register(this)
        this.initProxy()
    }

    destroyed (): void {
        this.$formulario.deregister(this)
    }

    onFormSubmit (): Promise<void> {
        this.childrenShouldShowErrors = true
        this.registry.forEach((input: FormularioInput) => {
            input.formShouldShowErrors = true
        })

        return this.hasValidationErrors()
            .then(hasErrors => hasErrors ? undefined : this.getValues())
            .then(data => {
                if (typeof data !== 'undefined') {
                    this.$emit('submit', data)
                } else {
                    this.$emit('error')
                }
            })
    }

    @Provide()
    addErrorObserver (observer: ErrorObserver): void {
        this.errorObserverRegistry.add(observer)
        if (observer.type === 'form') {
            observer.callback(this.mergedFormErrors)
        } else if (observer.field && has(this.mergedFieldErrors, observer.field)) {
            observer.callback(this.mergedFieldErrors[observer.field])
        }
    }

    @Provide()
    removeErrorObserver (observer: ErrorHandler): void {
        this.errorObserverRegistry.remove(observer)
    }

    @Provide('formularioRegister')
    register (field: string, component: FormularioInput): void {
        this.registry.register(field, component)
    }

    @Provide('formularioDeregister')
    deregister (field: string): void {
        this.registry.remove(field)
    }

    loadErrors ({ formErrors, inputErrors }: { formErrors: string[]; inputErrors: Record<string, string[]> }): void {
        // given an object of errors, apply them to this form
        this.localFormErrors = formErrors
        this.localFieldErrors = inputErrors
    }

    resetValidation (): void {
        this.localFormErrors = []
        this.localFieldErrors = {}
        this.childrenShouldShowErrors = false
        this.registry.forEach((input: FormularioInput) => {
            input.formShouldShowErrors = false
            input.behavioralErrorVisibility = false
        })
    }

    initProxy (): void {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    @Provide('formularioSetter')
    setFieldValue (field: string, value: any, emit = true): void {
        if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: value, ...proxy } = this.proxy
            this.proxy = proxy
        } else {
            setNested(this.proxy, field, value)
        }

        if (emit) {
            this.$emit('input', Object.assign({}, this.proxy))
        }
    }

    hasValidationErrors (): Promise<boolean> {
        return Promise.all(this.registry.reduce((resolvers: Promise<boolean>[], input: FormularioInput) => {
            resolvers.push(input.performValidation() && input.hasValidationErrors())
            return resolvers
        }, [])).then(results => results.some(hasErrors => hasErrors))
    }

    /**
     * Asynchronously generate the values payload of this form.
     */
    getValues (): Promise<Record<string, any>> {
        return new Promise((resolve, reject) => {
            const pending = []
            const values = cloneDeep(this.proxy)

            for (const key in values) {
                if (has(values, key) && typeof this.proxy[key] === 'object' && this.proxy[key] instanceof FileUpload) {
                    pending.push(
                        this.proxy[key].upload()
                            .then((data: Record<string, any>) => Object.assign(values, { [key]: data }))
                    )
                }
            }

            Promise.all(pending)
                .then(() => resolve(values))
                .catch(err => reject(err))
        })
    }

    setValues (values: Record<string, any>): void {
        const keys = Array.from(new Set([...Object.keys(values), ...Object.keys(this.proxy)]))
        let proxyHasChanges = false
        keys.forEach(field => {
            if (this.registry.hasNested(field)) {
                this.registry.getNested(field).forEach((registryField, registryKey) => {
                    const $input = this.registry.get(registryKey) as FormularioInput
                    const oldValue = getNested(this.proxy, registryKey)
                    const newValue = getNested(values, registryKey)

                    if (!shallowEqualObjects(newValue, oldValue)) {
                        this.setFieldValue(registryKey, newValue, false)
                        proxyHasChanges = true
                    }

                    if (!shallowEqualObjects(newValue, $input.proxy)) {
                        $input.context.model = newValue
                    }
                })
            }
        })

        this.initProxy()

        if (proxyHasChanges) {
            this.$emit('input', { ...this.proxy })
        }
    }
}
</script>
