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
    id,
    clone,
    deepEquals,
    get,
    has,
    merge,
    set,
    unset,
} from '@/utils'

import { FormularioField } from '@/types'
import { Violation } from '@/validation/validator'

import { UNREGISTER_BEHAVIOR } from '@/enum'

const update = (state: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
    if (value === undefined) {
        return unset(state, path) as Record<string, unknown>
    }

    return set(state, path, value) as Record<string, unknown>
}

@Component({ name: 'FormularioForm' })
export default class FormularioForm extends Vue {
    @Model('input', { default: () => ({}) })
    public readonly state!: Record<string, unknown>

    @Prop({ default: () => id('formulario-form') })
    public readonly id!: string

    // Describes validation errors of whole form
    @Prop({ default: () => ({}) }) readonly fieldsErrors!: Record<string, string[]>
    // Only used on FormularioForm default slot
    @Prop({ default: () => ([]) }) readonly formErrors!: string[]

    private proxy: Record<string, unknown> = {}
    private registry: Map<string, FormularioField> = new Map()
    // Local error messages are temporal, they wiped each resetValidation call
    private localFieldsErrors: Record<string, string[]> = {}
    private localFormErrors: string[] = []

    private get fieldsErrorsComputed (): Record<string, string[]> {
        return merge(this.fieldsErrors || {}, this.localFieldsErrors)
    }

    private get formErrorsComputed (): string[] {
        return [...this.formErrors, ...this.localFormErrors]
    }

    @Provide('__FormularioForm_register')
    private register (path: string, field: FormularioField): void {
        if (!this.registry.has(path)) {
            this.registry.set(path, field)
        }

        const value = get(this.proxy, path)

        if (!field.hasModel) {
            if (value !== undefined) {
                field.proxy = value
            } else {
                this.setFieldValue(path, null)
                this.emitInput()
            }
        } else if (!deepEquals(field.proxy, value)) {
            this.setFieldValue(path, field.proxy)
            this.emitInput()
        }

        if (has(this.fieldsErrorsComputed, path)) {
            field.setErrors(this.fieldsErrorsComputed[path])
        }
    }

    @Provide('__FormularioForm_unregister')
    private unregister (path: string, behavior: string): void {
        if (this.registry.has(path)) {
            this.registry.delete(path)

            if (behavior === UNREGISTER_BEHAVIOR.UNSET) {
                this.proxy = unset(this.proxy, path) as Record<string, unknown>
                this.emitInput()
            }
        }
    }

    @Provide('__FormularioForm_getState')
    private getState (): Record<string, unknown> {
        return this.proxy
    }

    @Provide('__FormularioForm_set')
    private setFieldValue (path: string, value: unknown): void {
        this.proxy = update(this.proxy, path, value)
    }

    @Provide('__FormularioForm_emitInput')
    private emitInput (): void {
        this.$emit('input', clone(this.proxy))
    }

    @Provide('__FormularioForm_emitValidation')
    private emitValidation (path: string, violations: Violation[]): void {
        this.$emit('validation', { path, violations })
    }

    @Watch('state', { deep: true })
    private onStateChange (newState: Record<string, unknown>): void {
        const newProxy = clone(newState)
        const oldProxy = this.proxy

        let proxyHasChanges = false

        this.registry.forEach((field, path) => {
            const newValue = get(newState, path, null)
            const oldValue = get(oldProxy, path, null)

            field.proxy = newValue

            if (!deepEquals(newValue, oldValue)) {
                field.$emit('input', newValue)
                update(newProxy, path, newValue)
                proxyHasChanges = true
            }
        })

        this.proxy = newProxy

        if (proxyHasChanges) {
            this.emitInput()
        }
    }

    @Watch('fieldsErrorsComputed', { deep: true, immediate: true })
    private onFieldsErrorsChange (fieldsErrors: Record<string, string[]>): void {
        this.registry.forEach((field, path) => {
            field.setErrors(fieldsErrors[path] || [])
        })
    }

    public created (): void {
        this.$formulario.register(this.id, this)
        if (typeof this.state === 'object') {
            this.proxy = clone(this.state)
        }
    }

    public beforeDestroy (): void {
        this.$formulario.unregister(this.id)
    }

    public runValidation (): Promise<Record<string, Violation[]>> {
        const runs: Promise<void>[] = []
        const violations: Record<string, Violation[]> = {}

        this.registry.forEach((field, path) => {
            runs.push(field.runValidation().then(v => { violations[path] = v }))
        })

        return Promise.all(runs).then(() => violations)
    }

    public hasValidationErrors (): Promise<boolean> {
        return this.runValidation().then(violations => {
            return Object.keys(violations).some(path => violations[path].length > 0)
        })
    }

    public setErrors ({ fieldsErrors, formErrors }: {
        fieldsErrors?: Record<string, string[]>;
        formErrors?: string[];
    }): void {
        this.localFieldsErrors = fieldsErrors || {}
        this.localFormErrors = formErrors || []
    }

    public resetValidation (): void {
        this.localFieldsErrors = {}
        this.localFormErrors = []
        this.registry.forEach((field: FormularioField) => {
            field.resetValidation()
        })
    }

    private onSubmit (): Promise<void> {
        return this.runValidation().then(violations => {
            const hasErrors = Object.keys(violations).some(path => violations[path].length > 0)

            if (!hasErrors) {
                this.$emit('submit', clone(this.proxy))
            } else {
                this.$emit('error', violations)
            }
        })
    }
}
</script>
