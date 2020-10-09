<template>
    <div
        class="formulario-group"
        data-type="group"
    >
        <slot />
    </div>
</template>

<script>
export default {
    name: 'FormularioGrouping',

    provide () {
        return {
            path: this.groupPath
        }
    },

    inject: ['path'],

    props: {
        name: {
            type: String,
            required: true
        },

        isArrayItem: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        groupPath () {
            if (this.isArrayItem) {
                return `${this.path}[${this.name}]`
            }

            if (this.path === '') {
                return this.name
            }

            return `${this.path}.${this.name}`
        }
    }
}
</script>
