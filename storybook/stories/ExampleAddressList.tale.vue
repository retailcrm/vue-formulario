<template>
    <FormularioForm v-model="values">
        <h1>Address list</h1>

        <FormularioInput
            v-slot="addressList"
            name="addressList"
        >
            <FormularioGrouping name="addressList">
                <FormularioGrouping
                    v-for="(address, addressIndex) in addressList.context.model"
                    :key="'address-' + addressIndex"
                    :name="addressIndex"
                    :is-array-item="true"
                    class="row mx-n2"
                >
                    <FormularioInput
                        v-slot="{ context }"
                        class="col col-auto px-2 mb-3"
                        name="street"
                        validation="required"
                    >
                        <label for="address-street">Street <span class="text-danger">*</span></label>
                        <input
                            id="address-street"
                            v-model="context.model"
                            class="field form-control"
                            type="text"
                            @blur="context.runValidation"
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
                        class="col col-auto px-2 mb-3"
                        name="building"
                        validation="^required|alphanumeric"
                    >
                        <label for="address-building">Building <span class="text-danger">*</span></label>
                        <input
                            id="address-building"
                            v-model="context.model"
                            class="field form-control"
                            type="text"
                            @blur="context.runValidation"
                        >

                        <div
                            v-for="(error, index) in context.allErrors"
                            :key="index"
                            class="text-danger"
                        >
                            {{ error }}
                        </div>
                    </FormularioInput>

                    <div class="remove-btn-wrapper">
                        <button
                            class="btn btn-danger"
                            type="button"
                            @click="removeAddress(addressIndex)"
                        >
                            Remove
                        </button>
                    </div>
                </FormularioGrouping>
            </FormularioGrouping>

            <button
                class="btn btn-primary"
                type="button"
                @click="addAddressBlank"
            >
                Add address
            </button>
        </FormularioInput>
    </FormularioForm>
</template>

<script>
import FormularioForm from '@/FormularioForm'
import FormularioGrouping from '@/FormularioGrouping'
import FormularioInput from '@/FormularioInput'

export default {
    name: 'ExampleAddressListTale',

    components: {
        FormularioForm,
        FormularioGrouping,
        FormularioInput,
    },

    data: () => ({
        values: {
            addressList: [{
                street: 'Baker Street',
                building: '221b',
            }],
        },
    }),

    created () {
        this.$formulario.extend({
            validationMessages: {
                alphanumeric: () => 'Value must be alphanumeric',
                number: () => 'Value must be a number',
                required: () => 'Value is required',
            },
        })
    },

    methods: {
        addAddressBlank () {
            this.values.addressList.push({
                street: '',
                building: '',
            })
        },

        removeAddress (index) {
            this.values.addressList.splice(index, 1)
        },
    },
}
</script>

<style>
.field {
    max-width: 250px;
}

.remove-btn-wrapper {
    padding-top: 32px;
}
</style>
