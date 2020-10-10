<template>
    <div
        class="formulario-group"
        data-type="group"
    >
        <slot />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({
    provide () {
        return {
            path: this.groupPath,
        }
    },

    inject: ['path'],
})
export default class FormularioGrouping extends Vue {
    @Prop({ required: true })
    readonly name!: string

    @Prop({ default: false })
    readonly isArrayItem!: boolean

    get groupPath () {
        if (this.isArrayItem) {
            return `${this.path}[${this.name}]`
        }

        if (this.path === '') {
            return this.name
        }

        return `${this.path}.${this.name}`
    }
}
</script>
