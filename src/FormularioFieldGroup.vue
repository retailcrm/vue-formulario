<template>
    <div>
        <slot />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {
    Component,
    Inject,
    Prop,
    Provide,
} from 'vue-property-decorator'

@Component({ name: 'FormularioFieldGroup' })
export default class FormularioFieldGroup extends Vue {
    @Inject({ default: '' }) __Formulario_path!: string

    @Prop({ required: true })
    readonly name!: string

    @Provide('__Formulario_path')
    get fullPath (): string {
        const path = `${this.name}`

        if (parseInt(path).toString() === path) {
            return `${this.__Formulario_path}[${path}]`
        }

        if (this.__Formulario_path === '') {
            return path
        }

        return `${this.__Formulario_path}.${path}`
    }
}
</script>
