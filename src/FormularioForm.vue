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
import { cloneDeep, getNested, has, setNested, shallowEqualObjects } from '@/libs/utils'
import merge from '@/utils/merge'
import Registry from '@/form/registry'
import FormularioInput from '@/FormularioInput.vue'

import {
    ErrorHandler,
    ErrorObserver,
    ErrorObserverRegistry,
} from '@/validation/ErrorObserver'

import { Violation } from '@/validation/validator'

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue {
    @Model('input', { default: () => ({}) })
    public readonly formularioValue!: Record<string, any>

    // Errors record, describing state validation errors of whole form
    @Prop({ default: () => ({}) }) readonly errors!: Record<string, any>
    // Form errors only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    @Provide()
    public path = ''

    public proxy: Record<string, any> = {}

    registry: Registry = new Registry(this)

    private errorObserverRegistry = new ErrorObserverRegistry()
    // Local error messages are temporal, they wiped each resetValidation call
    private localFormErrors: string[] = []
    private localFieldErrors: Record<string, string[]> = {}

    get mergedFormErrors (): string[] {
        return [...this.formErrors, ...this.localFormErrors]
    }

    get mergedFieldErrors (): Record<string, string[]> {
        return merge(this.errors || {}, this.localFieldErrors)
    }

    get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'formularioValue')
    }

    get hasInitialValue (): boolean {
        return this.formularioValue && typeof this.formularioValue === 'object'
    }

    get initialValues (): Record<string, any> {
        if (this.hasModel && typeof this.formularioValue === 'object') {
            // If there is a v-model on the form/group, use those values as first priority
            return { ...this.formularioValue } // @todo - use a deep clone to detach reference types
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
        this.initProxy()
    }

    @Provide()
    getFormValues (): Record<string, any> {
        return this.proxy
    }

    onFormSubmit (): Promise<void> {
        return this.hasValidationErrors()
            .then(hasErrors => hasErrors ? undefined : cloneDeep(this.proxy))
            .then(data => {
                if (typeof data !== 'undefined') {
                    this.$emit('submit', data)
                } else {
                    this.$emit('error')
                }
            })
    }

    @Provide()
    onFormularioFieldValidation (payload: { name: string; violations: Violation[]}): void {
        this.$emit('validation', payload)
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

    initProxy (): void {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    setValues (values: Record<string, any>): void {
        const keys = Array.from(new Set([...Object.keys(values), ...Object.keys(this.proxy)]))
        let proxyHasChanges = false
        keys.forEach(field => {
            if (!this.registry.hasNested(field)) {
                return
            }

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
        })

        this.initProxy()

        if (proxyHasChanges) {
            this.$emit('input', { ...this.proxy })
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

    setErrors ({ formErrors, inputErrors }: { formErrors?: string[]; inputErrors?: Record<string, string[]> }): void {
        // given an object of errors, apply them to this form
        this.localFormErrors = formErrors || []
        this.localFieldErrors = inputErrors || {}
    }

    resetValidation (): void {
        this.localFormErrors = []
        this.localFieldErrors = {}
        this.registry.forEach((input: FormularioInput) => {
            input.resetValidation()
        })
    }
}
</script>
