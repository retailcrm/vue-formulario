import Vue from 'vue'

import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Formulario from '@/index.ts'
import FormularioFieldGroup from '@/FormularioFieldGroup.vue'
import FormularioForm from '@/FormularioForm.vue'

Vue.use(Formulario)

describe('FormularioFieldGroup', () => {
    it('Grouped fields to be set', async () => {
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

    it('Grouped fields to be got', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: {
                formularioValue: {
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

    it('Data reactive with grouped fields', async () => {
        const wrapper = mount({
            data: () => ({ values: {} }),
            template: `
                <FormularioForm name="form" v-model="values">
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

    it('Errors are set for grouped fields', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: {
                formularioValue: {},
                errors: { 'group.text': 'Test error' },
            },
            slots: {
                default: `
                    <FormularioGrouping name="group">
                        <FormularioField ref="input" name="text" v-slot="{ context }">
                            <span v-for="error in context.errors">{{ error }}</span>
                        </FormularioField>
                    </FormularioGrouping>
                `,
            },
        })
        expect(wrapper.findAll('span').length).toBe(1)
    })
})
