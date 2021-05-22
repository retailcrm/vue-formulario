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

    @Prop({ default: false })
    readonly isArrayItem!: boolean

    @Provide('__Formulario_path')
    get groupPath (): string {
        if (this.isArrayItem) {
            return `${this.__Formulario_path}[${this.name}]`
        }

        if (this.__Formulario_path === '') {
            return this.name
        }

        return `${this.path}.${this.name}`
    }
}
</script>
