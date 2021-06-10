<template>
    <FormularioForm v-model="values">
        <h1>Delivery</h1>

        <h3>Customer</h3>

        <FormularioFieldGroup
            name="customer"
            class="row mx-n2"
        >
            <FormularioField
                v-slot="{ context }"
                name="name"
                class="col col-auto px-2 mb-3"
            >
                <label for="customer-name">Name</label>
                <input
                    id="customer-name"
                    v-model="context.model"
                    class="field form-control"
                    type="text"
                    @blur="context.runValidation"
                >
            </FormularioField>
        </FormularioFieldGroup>

        <h3>Address list</h3>

        <FormularioField
            v-slot="addressList"
            name="addressList"
        >
            <FormularioFieldGroup name="addressList">
                <FormularioFieldGroup
                    v-for="(address, addressIndex) in addressList.context.model"
                    :key="'address-' + addressIndex"
                    :name="addressIndex"
                    class="row mx-n2"
                >
                    <FormularioField
                        v-slot="{ context }"
                        class="col col-auto px-2 mb-3"
                        name="street"
                        validation="required"
                    >
                        <label for="address-street">Street</label>
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
                    </FormularioField>

                    <FormularioField
                        v-slot="{ context }"
                        class="col col-auto px-2 mb-3"
                        name="building"
                        validation="^required|alphanumeric"
                    >
                        <label for="address-building">Building</label>
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
                    </FormularioField>

                    <div class="remove-btn-wrapper">
                        <button
                            class="btn btn-danger"
                            type="button"
                            @click="removeAddress(addressIndex)"
                        >
                            Remove
                        </button>
                    </div>
                </FormularioFieldGroup>
            </FormularioFieldGroup>

            <button
                class="btn btn-primary"
                type="button"
                @click="addAddressBlank"
            >
                Add address
            </button>
        </FormularioField>
    </FormularioForm>
</template>

<script>
import FormularioField from '@/FormularioField'
import FormularioFieldGroup from '@/FormularioFieldGroup'
import FormularioForm from '@/FormularioForm'

export default {
    name: 'ExampleAddressListTale',

    components: {
        FormularioField,
        FormularioFieldGroup,
        FormularioForm,
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
