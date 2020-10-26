<template>
    <FormularioForm v-model="values">
        <FormularioInput
            v-slot="{ context }"
            :validation-messages="{
                number: 'The value is not a number',
                required: 'Value required',
            }"
            class="mb-3"
            name="number"
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
                {{ error.message }}
            </div>
        </FormularioInput>

        <FormularioInput
            v-slot="{ context }"
            :validation-messages="{ in: 'The value is not in range (abc,def)' }"
            class="mb-3"
            name="abcdef-field"
            validation="in:abc,def"
        >
            <label for="abcdef-field">Text field (in:abc,def)</label>
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

        <div>{{ values }}</div>
    </FormularioForm>
</template>

<script>
import FormularioForm from '@/FormularioForm'
import FormularioInput from '@/FormularioInput'

export default {
    name: 'FormularioInputTale',

    components: {
        FormularioForm,
        FormularioInput,
    },

    data: () => ({
        values: {},
    }),
}
</script>
