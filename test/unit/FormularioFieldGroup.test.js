import Vue from 'vue'

import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Formulario from '@/index.ts'
import FormularioFieldGroup from '@/FormularioFieldGroup.vue'
import FormularioForm from '@/FormularioForm.vue'

Vue.use(Formulario)

describe('FormularioFieldGroup', () => {
    test('grouped fields to be set', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <FormularioFieldGroup name="group">
                        <FormularioField name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                        </FormularioField>
                    </FormularioFieldGroup>
                `
            }
        })

        expect(wrapper.findAll('input[type="text"]').length).toBe(1)

        wrapper.find('input[type="text"]').setValue('test')
        wrapper.find('form').trigger('submit')

        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['submit']).toBeTruthy()
        expect(emitted['submit']).toEqual([[{ group: { text: 'test' } }]])
    })

    test('grouped fields to be got', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: {
                state: {
                    group: { text: 'Group text' },
                    text: 'Text',
                },
            },
            slots: {
                default: `
                    <FormularioFieldGroup name="group">
                        <FormularioField name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                        </FormularioField>
                    </FormularioFieldGroup>
                `
            }
        })
        expect(wrapper.find('input[type="text"]').element['value']).toBe('Group text')
    })

    test('data reactive with grouped fields', async () => {
        const wrapper = mount({
            data: () => ({ values: {} }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioFieldGroup name="group">
                        <FormularioField name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                            <span>{{ values.group.text }}</span>
                        </FormularioField>
                    </FormularioFieldGroup>
                </FormularioForm>
            `
        })

        expect(wrapper.find('span').text()).toBe('')

        wrapper.find('input[type="text"]').setValue('test')

        await flushPromises()

        expect(wrapper.find('span').text()).toBe('test')
    })

    test('errors are set for grouped fields', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { fieldsErrors: { 'address.street': 'Test error' } },
            slots: {
                default: `
                    <FormularioFieldGroup name="address">
                        <FormularioField ref="input" name="street" v-slot="{ context }">
                            <span v-for="error in context.errors">{{ error }}</span>
                        </FormularioField>
                    </FormularioFieldGroup>
                `,
            },
        })
        expect(wrapper.findAll('span').length).toBe(1)
    })
})
