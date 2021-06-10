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
    get,
    has,
    merge,
    set,
    shallowEquals,
    unset,
} from '@/utils'

import PathRegistry from '@/PathRegistry'

import { FormularioFieldInterface } from '@/types'
import {
    Violation,
    ViolationsRecord,
} from '@/validation/validator'

type ErrorsRecord = Record<string, string[]>

type ValidationEventPayload = {
    name: string;
    violations: Violation[];
}

let counter = 0

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue {
    @Model('input', { default: () => ({}) })
    public readonly state!: Record<string, unknown>

    @Prop({ default: () => `formulario-form-${++counter}` })
    public readonly id!: string

    // Describes validation errors of whole form
    @Prop({ default: () => ({}) }) readonly fieldsErrors!: ErrorsRecord
    // Only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    private proxy: Record<string, unknown> = {}
    private registry: PathRegistry<FormularioFieldInterface> = new PathRegistry()
    // Local error messages are temporal, they wiped each resetValidation call
    private localFieldsErrors: ErrorsRecord = {}
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

    @Provide('__FormularioForm_register')
    private register (path: string, field: FormularioFieldInterface): void {
        this.registry.add(path, field)

        const value = get(this.modelCopy, path)

        if (!field.hasModel && this.modelIsDefined) {
            if (value !== undefined) {
                field.model = value
            } else {
                this.setFieldValue(path, null)
                this.emitInput()
            }
        } else if (field.hasModel && !shallowEquals(field.proxy, value)) {
            this.setFieldValue(path, field.proxy)
            this.emitInput()
        }

        if (has(this.fieldsErrorsComputed, path)) {
            field.setErrors(this.fieldsErrorsComputed[path])
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

    @Provide('__FormularioForm_getState')
    private getState (): Record<string, unknown> {
        return this.proxy
    }

    @Provide('__FormularioForm_set')
    private setFieldValue (path: string, value: unknown): void {
        if (value === undefined) {
            this.proxy = unset(this.proxy, path) as Record<string, unknown>
        } else {
            this.proxy = set(this.proxy, path, value) as Record<string, unknown>
        }
    }

    @Provide('__FormularioForm_emitInput')
    private emitInput (): void {
        this.$emit('input', { ...this.proxy })
    }

    @Provide('__FormularioForm_emitValidation')
    private emitValidation (payload: ValidationEventPayload): void {
        this.$emit('validation', payload)
    }

    @Watch('state', { deep: true })
    private onStateChange (state: Record<string, unknown>): void {
        if (this.hasModel && state && typeof state === 'object') {
            this.loadState(state)
        }
    }

    @Watch('fieldsErrorsComputed', { deep: true, immediate: true })
    private onFieldsErrorsChange (fieldsErrors: Record<string, string[]>): void {
        this.registry.forEach((field, path) => {
            field.setErrors(fieldsErrors[path] || [])
        })
    }

    public created (): void {
        this.syncProxy()
        this.$formulario.register(this.id, this)
    }

    public beforeDestroy (): void {
        this.$formulario.unregister(this.id)
    }

    public runValidation (): Promise<ViolationsRecord> {
        const violations: ViolationsRecord = {}
        const runs = this.registry.map((field: FormularioFieldInterface, path: string) => {
            return field.runValidation().then(v => { violations[path] = v })
        })

        return Promise.all(runs).then(() => violations)
    }

    public hasValidationErrors (): Promise<boolean> {
        return this.runValidation().then(violations => {
            return Object.keys(violations).some(path => violations[path].length > 0)
        })
    }

    public setErrors ({ fieldsErrors, formErrors }: { fieldsErrors?: ErrorsRecord; formErrors?: string[] }): void {
        this.localFieldsErrors = fieldsErrors || {}
        this.localFormErrors = formErrors || []
    }

    public resetValidation (): void {
        this.localFieldsErrors = {}
        this.localFormErrors = []
        this.registry.forEach((field: FormularioFieldInterface) => {
            field.resetValidation()
        })
    }

    private onSubmit (): Promise<void> {
        return this.runValidation()
            .then(violations => {
                const hasErrors = Object.keys(violations).some(path => violations[path].length > 0)

                if (!hasErrors) {
                    this.$emit('submit', clone(this.proxy))
                } else {
                    this.$emit('error', violations)
                }
            })
    }

    private loadState (state: Record<string, unknown>): void {
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
                const oldValue = get(this.proxy, path, null)
                const newValue = get(state, path, null)

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

    private syncProxy (): void {
        if (this.modelIsDefined) {
            this.proxy = this.modelCopy
        }
    }
}
</script>
