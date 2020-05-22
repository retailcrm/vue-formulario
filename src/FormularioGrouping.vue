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
    props: {
        name: {
                type: String,
                required: true
        },
        isArrayItem: {
                type: Boolean,
                default: false
        },
    },
    provide () {
        return {
            path: this.groupPath
        }
    },
    inject: ['path'],
    computed: {
        groupPath () {
            if (this.isArrayItem) {
                return this.path + '[' + this.name + ']';
            } else {
                if (this.path === '') {
                    return this.name;
                }

                return this.path + '.' + this.name;
            }
        }
    }
}
</script>
