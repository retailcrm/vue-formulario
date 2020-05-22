import Vue from 'vue'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Formulario from '@/Formulario.js'
import FormularioInput from '@/FormularioInput.vue'
import FormularioForm from '@/FormularioForm.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'

Vue.use(Formulario)

describe('FormularioGrouping', () => {
    it('grouped fields to be setted', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { name: 'form',  },
            slots: {
                default: `
                    <FormularioGrouping name="sub">
                        <FormularioInput name="text" v-slot="vSlot">
                            <input type="text" v-model="vSlot.context.model">
                        </FormularioInput>
                    </FormularioGrouping>
                `
            }
        })
        expect(wrapper.findAll('input[type="text"]').length).toBe(1)
        wrapper.find('input[type="text"]').setValue('test')

        const submission = await wrapper.vm.formSubmitted()
        expect(submission).toEqual({sub: {text: 'test'}})
    })

    it('grouped fields to be getted', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { name: 'form', formularioValue: { sub: {text: 'initial value'}, text: 'simple text' } },
            slots: {
                default: `
                    <FormularioGrouping name="sub">
                        <FormularioInput name="text" v-slot="vSlot">
                            <input type="text" v-model="vSlot.context.model">
                        </FormularioInput>
                    </FormularioGrouping>
                `
            }
        })
        expect(wrapper.find('input[type="text"]').element.value).toBe('initial value')
    })

    it('data reactive with grouped fields', async () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {}
                }
            },
            template: `
                <FormularioForm name="form" v-model="formValues">
                    <FormularioGrouping name="sub">
                        <FormularioInput name="text" v-slot="vSlot">
                            <input type="text" v-model="vSlot.context.model">
                            <span>{{ formValues.sub.text }}</span>
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

    it('errors are setted for grouped fields', async () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {}
                }
            },
            template: `
                <FormularioForm name="form" v-model="formValues" :errors="{'sub.text': 'Test error'}">
                    <FormularioGrouping name="sub">
                        <FormularioInput name="text" v-slot="vSlot">
                            <span v-for="error in vSlot.context.allErrors">{{ error }}</span>
                        </FormularioInput>
                    </FormularioGrouping>
                </FormularioForm>
            `
        })
        expect(wrapper.findAll('span').length).toBe(1)
    })
})
