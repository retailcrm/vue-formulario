<template>
    <FormularioForm v-model="values">
        <FormularioInput
            v-slot="{ context }"
            name="text"
            validation="number|required"
        >
            <label for="text-field">Text field</label>

            <div>
                <input
                    id="text-field"
                    v-model="context.model"
                    type="text"
                >
            </div>

            <div
                v-for="(error, index) in context.allErrors"
                :key="index"
            >
                {{ error.message }}
            </div>
        </FormularioInput>
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
    })
}
</script>
