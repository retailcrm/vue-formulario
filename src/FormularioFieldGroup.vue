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
        const name = `${this.name}`

        if (parseInt(name).toString() === name) {
            return `${this.__Formulario_path}[${name}]`
        }

        if (this.__Formulario_path === '') {
            return name
        }

        return `${this.__Formulario_path}.${name}`
    }
}
</script>
