<template>
    <form @submit.prevent="onSubmit">
        <slot :errors="formErrorsComputed" />
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

    // Describes validation errors of whole form
    @Prop({ default: () => ({}) }) readonly fieldsErrors!: Record<string, string[]>
    // Only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    public proxy: Record<string, unknown> = {}

    private registry: PathRegistry<FormularioField> = new PathRegistry()

    // Local error messages are temporal, they wiped each resetValidation call
    private localFieldsErrors: Record<string, string[]> = {}
    private localFormErrors: string[] = []

    private get hasModel (): boolean {
        return has(this.$options.propsData || {}, 'state')
    }

    private get modelIsDefined (): boolean {
        return this.state && typeof this.state === 'object'
    }

    private get modelCopy (): Record<string, unknown> {
        if (this.hasModel && typeof this.state === 'object') {
            return { ...this.state } // @todo - use a deep clone to detach reference types
        }

        return {}
    }

    private get fieldsErrorsComputed (): Record<string, string[]> {
        return merge(this.fieldsErrors || {}, this.localFieldsErrors)
    }

    private get formErrorsComputed (): string[] {
        return [...this.formErrors, ...this.localFormErrors]
    }

    @Watch('state', { deep: true })
    private onStateChange (values: Record<string, unknown>): void {
        if (this.hasModel && values && typeof values === 'object') {
            this.setValues(values)
        }
    }

    @Watch('fieldsErrorsComputed', { deep: true, immediate: true })
    private onFieldsErrorsChange (fieldsErrors: Record<string, string[]>): void {
        this.registry.forEach((field, path) => {
            field.setErrors(fieldsErrors[path] || [])
        })
    }

    @Provide('__FormularioForm_getValue')
    private getValue (): Record<string, unknown> {
        return this.proxy
    }

    created (): void {
        this.syncProxy()
    }

    private onSubmit (): Promise<void> {
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

    @Provide('__FormularioForm_register')
    private register (path: string, field: FormularioField): void {
        this.registry.add(path, field)

        const value = getNested(this.modelCopy, path)

        if (!field.hasModel && this.modelIsDefined && value !== undefined) {
            // In the case that the form is carrying an initial value and the
            // element is not, set it directly.
            field.model = value
        } else if (field.hasModel && !shallowEquals(field.proxy, value)) {
            // In this case, the field is v-modeled or has an initial value and the
            // form has no value or a different value, so use the field value
            this.setFieldValueAndEmit(path, field.proxy)
        }

        if (has(this.fieldsErrorsComputed, path)) {
            field.setErrors(this.fieldsErrorsComputed[path] || [])
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

    @Provide('__FormularioForm_emitValidation')
    private emitValidation (payload: ValidationEventPayload): void {
        this.$emit('validation', payload)
    }

    private syncProxy (): void {
        if (this.modelIsDefined) {
            this.proxy = this.modelCopy
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
                    field.model = newValue
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

    setErrors ({ fieldsErrors, formErrors }: { fieldsErrors?: Record<string, string[]>; formErrors?: string[] }): void {
        this.localFieldsErrors = fieldsErrors || {}
        this.localFormErrors = formErrors || []
    }

    hasValidationErrors (): Promise<boolean> {
        return Promise.all(this.registry.reduce((resolvers: Promise<boolean>[], field: FormularioField) => {
            resolvers.push(field.runValidation() && field.hasValidationErrors())
            return resolvers
        }, [])).then(results => results.some(hasErrors => hasErrors))
    }

    resetValidation (): void {
        this.localFieldsErrors = {}
        this.localFormErrors = []
        this.registry.forEach((field: FormularioField) => {
            field.resetValidation()
        })
    }
}
</script>
