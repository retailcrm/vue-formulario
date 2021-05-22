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
import {
    clone,
    getNested,
    has,
    merge,
    setNested,
    shallowEquals,
} from '@/utils'

import FormularioFormRegistry from '@/FormularioFormRegistry'

import FormularioField from '@/FormularioField.vue'

import { Violation } from '@/validation/validator'

type ValidationEventPayload = {
    name: string;
    violations: Violation[];
}

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue {
    @Model('input', { default: () => ({}) })
    public readonly formularioValue!: Record<string, unknown>

    // Errors record, describing state validation errors of whole form
    @Prop({ default: () => ({}) }) readonly errors!: Record<string, string[]>
    // Form errors only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    public proxy: Record<string, unknown> = {}

    private registry: FormularioFormRegistry = new FormularioFormRegistry(this)

    // Local error messages are temporal, they wiped each resetValidation call
    private localFormErrors: string[] = []
    private localFieldErrors: Record<string, string[]> = {}

    get initialValues (): Record<string, unknown> {
        if (this.hasModel && typeof this.formularioValue === 'object') {
            // If there is a v-model on the form/group, use those values as first priority
            return { ...this.formularioValue } // @todo - use a deep clone to detach reference types
        }

        return {}
    }

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

    @Watch('formularioValue', { deep: true })
    onFormularioValueChange (values: Record<string, unknown>): void {
        if (this.hasModel && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('mergedFieldErrors', { deep: true, immediate: true })
    onMergedFieldErrorsChange (errors: Record<string, string[]>): void {
        this.registry.forEach((vm, path) => {
            vm.setErrors(errors[path] || [])
        })
    }

    created (): void {
        this.initProxy()
    }

    @Provide('__FormularioForm_getValue')
    getFormValues (): Record<string, unknown> {
        return this.proxy
    }

    onFormSubmit (): Promise<void> {
        return this.hasValidationErrors()
            .then(hasErrors => hasErrors ? undefined : clone(this.proxy))
            .then(data => {
                if (typeof data !== 'undefined') {
                    this.$emit('submit', data)
                } else {
                    this.$emit('error')
                }
            })
    }

    @Provide('__FormularioForm_emitValidation')
    onFormularioFieldValidation (payload: ValidationEventPayload): void {
        this.$emit('validation', payload)
    }

    @Provide('__FormularioForm_register')
    private register (field: string, vm: FormularioField): void {
        this.registry.add(field, vm)

        if (has(this.mergedFieldErrors, field)) {
            vm.setErrors(this.mergedFieldErrors[field] || [])
        }
    }

    @Provide('__FormularioForm_unregister')
    private unregister (field: string): void {
        if (this.registry.has(field)) {
            this.registry.remove(field)
        }
    }

    initProxy (): void {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    setValues (values: Record<string, unknown>): void {
        const keys = Array.from(new Set([...Object.keys(values), ...Object.keys(this.proxy)]))
        let proxyHasChanges = false
        keys.forEach(field => {
            if (!this.registry.hasNested(field)) {
                return
            }

            this.registry.getNested(field).forEach((_, fqn) => {
                const $field = this.registry.get(fqn) as FormularioField

                const oldValue = getNested(this.proxy, fqn)
                const newValue = getNested(values, fqn)

                if (!shallowEquals(newValue, oldValue)) {
                    this.setFieldValue(fqn, newValue)
                    proxyHasChanges = true
                }

                if (!shallowEquals(newValue, $field.proxy)) {
                    $field.context.model = newValue
                }
            })
        })

        this.initProxy()

        if (proxyHasChanges) {
            this.$emit('input', { ...this.proxy })
        }
    }

    setFieldValue (field: string, value: unknown): void {
        if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: value, ...proxy } = this.proxy
            this.proxy = proxy
        } else {
            setNested(this.proxy, field, value)
        }
    }

    @Provide('__FormularioForm_set')
    setFieldValueAndEmit (field: string, value: unknown): void {
        this.setFieldValue(field, value)
        this.$emit('input', { ...this.proxy })
    }

    setErrors ({ formErrors, inputErrors }: { formErrors?: string[]; inputErrors?: Record<string, string[]> }): void {
        this.localFormErrors = formErrors || []
        this.localFieldErrors = inputErrors || {}
    }

    hasValidationErrors (): Promise<boolean> {
        return Promise.all(this.registry.reduce((resolvers: Promise<boolean>[], field: FormularioField) => {
            resolvers.push(field.runValidation() && field.hasValidationErrors())
            return resolvers
        }, [])).then(results => results.some(hasErrors => hasErrors))
    }

    resetValidation (): void {
        this.localFormErrors = []
        this.localFieldErrors = {}
        this.registry.forEach((field: FormularioField) => {
            field.resetValidation()
        })
    }
}
</script>
