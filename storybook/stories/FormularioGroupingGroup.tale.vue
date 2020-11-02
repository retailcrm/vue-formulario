<template>
    <div>
        <div
            v-for="(item, groupIndex) in groups"
            :key="groupIndex"
        >
            <FormularioGrouping :name="`groups[${groupIndex}]`">
                <FormularioInput
                    v-slot="{ context }"
                    class="mb-3"
                    name="text"
                    validation="number|required"
                    validation-behavior="live"
                >
                    <label for="text-field">Text field (number|required)</label>
                    <input
                        id="text-field"
                        v-model="context.model"
                        type="text"
                        class="form-control"
                        style="max-width: 250px;"
                    >

                    <div
                        v-for="(error, index) in context.allErrors"
                        :key="index"
                        class="text-danger"
                    >
                        {{ error }}
                    </div>
                </FormularioInput>

                <FormularioInput
                    v-slot="{ context }"
                    :validation-messages="{ in: 'The value was different than expected' }"
                    class="mb-3"
                    name="abcdef-field"
                    validation="in:abcdef"
                    validation-behavior="live"
                >
                    <label for="abcdef-field">Text field (in:abcdef)</label>
                    <input
                        id="abcdef-field"
                        v-model="context.model"
                        type="text"
                        class="form-control"
                        style="max-width: 250px;"
                    >

                    <div
                        v-for="(error, index) in context.allErrors"
                        :key="index"
                        class="text-danger"
                    >
                        {{ error }}
                    </div>
                </FormularioInput>
            </FormularioGrouping>

            <button @click="onRemoveGroup(groupIndex)">
                Remove Group
            </button>
        </div>

        <button @click="onAddGroup">
            Add Group
        </button>
    </div>
</template>

<script>
import FormularioGrouping from '@/FormularioGrouping'
import FormularioInput from '@/FormularioInput'

export default {
    name: 'FormularioGroupingGroupTale',

    components: {
        FormularioGrouping,
        FormularioInput,
    },

    model: {
        prop: 'groups',
        event: 'change'
    },

    props: {
        groups: {
            type: Array,
            required: true,
        },
    },

    methods: {
        onAddGroup () {
            this.$emit('change', this.groups.concat([{}]))
        },
        onRemoveGroup (removedIndex) {
            this.$emit('change', this.groups.filter((item, index) => {
                return index !== removedIndex
            }))
        }
    }
}
</script>
