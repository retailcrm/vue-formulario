<template>
    <FormularioForm v-model="values">
        <FormularioGrouping name="group">
            <FormularioInput
                v-slot="{ context }"
                class="mb-3"
                name="text"
                validation="number|required"
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

        <div>{{ values }}</div>
    </FormularioForm>
</template>

<script>
import FormularioForm from '@/FormularioForm'
import FormularioGrouping from '@/FormularioGrouping'
import FormularioInput from '@/FormularioInput'

export default {
    name: 'FormularioGroupingTale',

    components: {
        FormularioForm,
        FormularioGrouping,
        FormularioInput,
    },

    data: () => ({
        values: {},
    }),
}
</script>
