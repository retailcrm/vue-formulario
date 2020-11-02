<template>
    <FormularioForm v-model="values">
        <FormularioInput
            v-slot="{ context }"
            class="mb-3"
            name="groups"
            validation="min:1"
            validation-behavior="live"
        >
            <FormularioGroupingGroupTale v-model="context.model" />

            <div
                v-for="(error, index) in context.allErrors"
                :key="index"
                class="text-danger"
            >
                {{ error }}
            </div>
        </FormularioInput>

        <div>{{ values }}</div>
    </FormularioForm>
</template>

<script>
import FormularioForm from '@/FormularioForm'
import FormularioGroupingGroupTale from './FormularioGroupingGroup.tale.vue'

export default {
    name: 'FormularioGroupingTale',

    components: {
        FormularioForm,
        FormularioGroupingGroupTale,
    },

    data: () => ({
        values: { groups: [] },
    }),
}
</script>
