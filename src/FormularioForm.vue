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

import PathRegistry from '@/PathRegistry'

import FormularioField from '@/FormularioField.vue'

import { Violation } from '@/validation/validator'

type ValidationEventPayload = {
    name: string;
    violations: Violation[];
}

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue {
    @Model('input', { default: () => ({}) })
    public readonly state!: Record<string, unknown>

    // Errors record, describing state validation errors of whole form
    @Prop({ default: () => ({}) }) readonly errors!: Record<string, string[]>
    // Form errors only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    public proxy: Record<string, unknown> = {}

    private registry: PathRegistry<FormularioField> = new PathRegistry()

    // Local error messages are temporal, they wiped each resetValidation call
    private localFormErrors: string[] = []
    private localFieldErrors: Record<string, string[]> = {}

    get initialValues (): Record<string, unknown> {
        if (this.hasModel && typeof this.state === 'object') {
            // If there is a v-model on the form/group, use those values as first priority
            return { ...this.state } // @todo - use a deep clone to detach reference types
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
        return has(this.$options.propsData || {}, 'state')
    }

    get hasInitialValue (): boolean {
        return this.state && typeof this.state === 'object'
    }

    @Watch('state', { deep: true })
    onStateChange (values: Record<string, unknown>): void {
        if (this.hasModel && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('mergedFieldErrors', { deep: true, immediate: true })
    onMergedFieldErrorsChange (errors: Record<string, string[]>): void {
        this.registry.forEach((field, path) => {
            field.setErrors(errors[path] || [])
        })
    }

    created (): void {
        this.syncProxy()
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
    private emitValidation (payload: ValidationEventPayload): void {
        this.$emit('validation', payload)
    }

    @Provide('__FormularioForm_register')
    private register (path: string, field: FormularioField): void {
        this.registry.add(path, field)

        const value = getNested(this.initialValues, path)

        if (!field.hasModel && this.hasInitialValue && value !== undefined) {
            // In the case that the form is carrying an initial value and the
            // element is not, set it directly.
            // @ts-ignore
            field.context.model = value
        } else if (field.hasModel && !shallowEquals(field.proxy, value)) {
            // In this case, the field is v-modeled or has an initial value and the
            // form has no value or a different value, so use the field value
            this.setFieldValueAndEmit(path, field.proxy)
        }

        if (has(this.mergedFieldErrors, path)) {
            field.setErrors(this.mergedFieldErrors[path] || [])
        }
    }

    @Provide('__FormularioForm_unregister')
    private unregister (path: string): void {
        if (this.registry.has(path)) {
            this.registry.remove(path)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [path]: _, ...newProxy } = this.proxy
            this.proxy = newProxy
        }
    }

    syncProxy (): void {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues
        }
    }

    setValues (state: Record<string, unknown>): void {
        const paths = Array.from(new Set([
            ...Object.keys(state),
            ...Object.keys(this.proxy),
        ]))

        let proxyHasChanges = false

        paths.forEach(path => {
            if (!this.registry.hasSubset(path)) {
                return
            }

            this.registry.getSubset(path).forEach((field, path) => {
                const oldValue = getNested(this.proxy, path)
                const newValue = getNested(state, path)

                if (!shallowEquals(newValue, oldValue)) {
                    this.setFieldValue(path, newValue)
                    proxyHasChanges = true
                }

                if (!shallowEquals(newValue, field.proxy)) {
                    field.context.model = newValue
                }
            })
        })

        this.syncProxy()

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
