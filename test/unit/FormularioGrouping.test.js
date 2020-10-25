import Vue from 'vue'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Formulario from '@/index.ts'
import FormularioForm from '@/FormularioForm.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'

Vue.use(Formulario)

describe('FormularioGrouping', () => {
    it('Grouped fields to be set', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <FormularioGrouping name="group">
                        <FormularioInput name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                        </FormularioInput>
                    </FormularioGrouping>
                `
            }
        })

        expect(wrapper.findAll('input[type="text"]').length).toBe(1)

        wrapper.find('input[type="text"]').setValue('test')
        wrapper.find('form').trigger('submit')

        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['submit']).toBeTruthy()
        expect(emitted['submit'].length).toBe(1)
        expect(emitted['submit'][0]).toEqual([{ group: { text: 'test' } }])
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
                    <FormularioGrouping name="group">
                        <FormularioInput name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                        </FormularioInput>
                    </FormularioGrouping>
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
                    <FormularioGrouping name="group">
                        <FormularioInput name="text" v-slot="{ context }">
                            <input type="text" v-model="context.model">
                            <span>{{ values.group.text }}</span>
                        </FormularioInput>
                    </FormularioGrouping>
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
                        <FormularioInput ref="input" name="text" v-slot="{ context }">
                            <span v-for="error in context.allErrors">{{ error }}</span>
                        </FormularioInput>
                    </FormularioGrouping>
                `,
            },
        })
        expect(wrapper.findAll('span').length).toBe(1)
    })
})
