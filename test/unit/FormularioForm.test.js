import Vue from 'vue'

import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Formulario from '@/index.ts'
import FormularioForm from '@/FormularioForm.vue'

Vue.use(Formulario, {
    validationMessages: {
        required: () => 'required',
        'in': () => 'in',
        min: () => 'min',
    }
})

describe('FormularioForm', () => {
    test('renders a form DOM element', () => {
        const wrapper = mount(FormularioForm)
        expect(wrapper.find('form').exists()).toBe(true)
    })

    test('accepts a default slot', () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: '<div data-default />'
            },
        })

        expect(wrapper.find('form [data-default]').exists()).toBe(true)
    })

    test('can set a field’s initial value', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { state: { test: 'Has initial value' } },
            slots: {
                default: `
                    <FormularioField v-slot="{ context }" validation="required|in:bar" name="test" >
                        <input v-model="context.model" type="text">
                    </FormularioField>
                `
            }
        })

        await flushPromises()

        expect(wrapper.find('input').element['value']).toBe('Has initial value')
    })

    describe('emits input event', () => {
        test('when individual fields contain a populated value', async () => {
            const wrapper = mount(FormularioForm, {
                propsData: { state: { field: 'initial' } },
                slots: {
                    default: '<FormularioField name="field" value="populated" />'
                },
            })

            await Vue.nextTick()

            const emitted = wrapper.emitted('input')

            expect(emitted).toBeTruthy()
            expect(emitted[emitted.length - 1]).toEqual([{ field: 'populated' }])
        })

        test('when individual fields are edited', () => {
            const wrapper = mount(FormularioForm, {
                propsData: { state: { field: 'initial' } },
                slots: {
                    default: `
                        <FormularioField v-slot="{ context }" name="field" >
                            <input v-model="context.model" type="text">
                        </FormularioField>
                    `,
                },
            })

            wrapper.find('input').setValue('updated')

            const emitted = wrapper.emitted('input')

            expect(emitted).toBeTruthy()
            expect(emitted[emitted.length - 1]).toEqual([{ field: 'updated' }])
        })
    })

    test('updates a field when the form v-model is modified', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { state: { field: 'initial' } },
            slots: {
                default: `
                    <FormularioField v-slot="{ context }" name="field">
                        <input v-model="context.model" type="text">
                    </FormularioField>
                `
            },
        })

        const input = wrapper.find('input')

        expect(input).toBeTruthy()
        expect(input.element['value']).toBe('initial')

        wrapper.setProps({ state: { field: 'updated' } })

        await Vue.nextTick()

        expect(input.element['value']).toBe('updated')
    })

    test('updates a field when it is an instance of Date', async () => {
        const dateA = new Date('1970-01-01')
        const dateB = new Date()

        const wrapper = mount(FormularioForm,{
            propsData: { state: { date: dateA } },
            scopedSlots: {
                default: `
                    <FormularioField v-slot="{ context }" name="date">
                        <span v-if="context.model">{{ context.model.toISOString() }}</span>
                    </FormularioField>
                `,
            },
        })

        expect(wrapper.find('span').text()).toBe(dateA.toISOString())

        wrapper.setProps({ state: { date: dateB } })

        await Vue.nextTick()

        expect(wrapper.find('span').text()).toBe(dateB.toISOString())
    })

    test('resolves submitted form values to an object', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: '<FormularioField name="name" validation="required" value="Justin" />'
            },
        })

        wrapper.find('form').trigger('submit')

        await flushPromises()

        expect(wrapper.emitted('submit')).toEqual([
            [{ name: 'Justin' }],
        ])
    })

    test('resolves runValidation', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <div>
                        <FormularioField name="address.street" validation="required" />
                        <FormularioField name="address.building" validation="required" />
                    </div>
                `,
            },
        })

        const violations = await wrapper.vm.runValidation()
        const state = {
            address: {
                street: null,
            },
        }

        expect(violations).toEqual({
            'address.street': [{
                message: expect.any(String),
                rule: 'required',
                args: [],
                context: {
                    name: 'address.street',
                    value: null,
                    formValues: state,
                },
            }],
            'address.building': [{
                message: expect.any(String),
                rule: 'required',
                args: [],
                context: {
                    name: 'address.building',
                    value: '',
                    formValues: state,
                },
            }],
        })
    })

    test('resolves hasValidationErrors to true', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: '<FormularioField name="fieldName" validation="required" />',
            },
        })

        wrapper.find('form').trigger('submit')

        await flushPromises()

        expect(wrapper.emitted('error')).toBeTruthy()
        expect(wrapper.emitted('error').length).toBe(1)
    })

    describe('allows setting fields errors', () => {
        /**
         * @param props
         * @return {Wrapper<FormularioForm>}
         */
        const createWrapper = (props = {}) => mount(FormularioForm, {
            propsData: props,
            scopedSlots: {
                default: '<div><div v-for="error in props.errors" data-error /></div>',
            },
        })

        test('via prop', async () => {
            const wrapper = createWrapper({ formErrors: ['first', 'second'] })

            expect(wrapper.findAll('[data-error]').length).toBe(2)
        })

        test('manually with setErrors()', async () => {
            const wrapper = createWrapper({ formErrors: ['first', 'second'] })

            wrapper.vm.setErrors({ formErrors: ['third'] })

            await wrapper.vm.$nextTick()

            expect(wrapper.findAll('[data-error]').length).toBe(3)
        })
    })

    test('displays field errors on inputs with errors prop', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { fieldsErrors: { field: ['This field has an error'] }},
            slots: {
                default: `
                    <FormularioField v-slot="{ context }" name="field">
                        <span v-for="error in context.errors">{{ error }}</span>
                    </FormularioField>
                `,
            },
        })

        expect(wrapper.find('span').exists()).toBe(true)
        expect(wrapper.find('span').text()).toEqual('This field has an error')
    })

    describe('allows setting fields errors', () => {
        /**
         * @param props
         * @return {Wrapper<FormularioForm>}
         */
        const createWrapper = (props = {}) => mount(FormularioForm, {
            propsData: props,
            slots: {
                default: `
                    <div>
                        <FormularioField v-slot="{ context }" name="fieldA">
                            <div v-for="error in context.errors" data-error-a>{{ error }}</div>
                        </FormularioField>

                        <FormularioField v-slot="{ context }" name="fieldB">
                            <div v-for="error in context.errors" data-error-b>{{ error }}</div>
                        </FormularioField>
                    </div>
                `,
            }
        })

        test('via prop', async () => {
            const wrapper = createWrapper({
                fieldsErrors: { fieldA: ['first'], fieldB: ['first', 'second']},
            })

            expect(wrapper.findAll('[data-error-a]').length).toBe(1)
            expect(wrapper.findAll('[data-error-b]').length).toBe(2)
        })

        test('manually with setErrors()', async () => {
            const wrapper = createWrapper()

            expect(wrapper.findAll('[data-error-a]').length).toBe(0)
            expect(wrapper.findAll('[data-error-b]').length).toBe(0)

            wrapper.vm.setErrors({ fieldsErrors: { fieldA: ['first'], fieldB: ['first', 'second'] } })

            await Vue.nextTick()

            expect(wrapper.findAll('[data-error-a]').length).toBe(1)
            expect(wrapper.findAll('[data-error-b]').length).toBe(2)
        })
    })

    describe('emits correct validation event', () => {
        /**
         * @return {Wrapper<FormularioForm>}
         */
        const createWrapper = () => mount(FormularioForm, {
            slots: {
                default: `
                    <FormularioField v-slot="{ context }" name="foo" validation="required|in:foo">
                        <input v-model="context.model" type="text" @blur="context.runValidation()">
                    </FormularioField>
                    <FormularioField name="bar" validation="required" />
                `,
            },
        })

        test('when no errors', async () => {
            const wrapper = createWrapper()

            wrapper.find('input[type="text"]').setValue('foo')
            wrapper.find('input[type="text"]').trigger('blur')

            await flushPromises()

            expect(wrapper.emitted('validation')).toBeTruthy()
            expect(wrapper.emitted('validation')).toEqual([[{
                name: 'foo',
                violations: [],
            }]])
        })

        test('on entry', async () => {
            const wrapper = createWrapper()

            wrapper.find('input[type="text"]').setValue('bar')
            wrapper.find('input[type="text"]').trigger('blur')

            await flushPromises()

            expect(wrapper.emitted('validation')).toBeTruthy()
            expect(wrapper.emitted('validation')).toEqual([[ {
                name: 'foo',
                violations: [ {
                    rule: expect.any(String),
                    args: ['foo'],
                    context: {
                        value: 'bar',
                        formValues: expect.any(Object),
                        name: 'foo',
                    },
                    message: expect.any(String),
                } ],
            } ]])
        })
    })

    test('allows resetting form validation', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <div>
                        <FormularioField v-slot="{ context }" name="username" validation="required">
                            <input v-model="context.model" type="text">
                            <div v-for="error in context.allErrors" data-username-error />
                        </FormularioField>

                        <FormularioField v-slot="{ context }" name="password" validation="required|min:4,length">
                            <input v-model="context.model" type="password" @blur="context.runValidation()">
                            <div v-for="error in context.allErrors" data-password-error />
                        </FormularioField>
                    </div>
                `,
            },
        })

        const password = wrapper.find('input[type="password"]')

        password.setValue('foo')
        password.trigger('input')
        password.trigger('blur')

        await flushPromises()

        wrapper.vm.setErrors({ fieldsErrors: { username: ['required'] } })

        await Vue.nextTick()

        expect(wrapper.findAll('[data-username-error]').length).toBe(1)
        expect(wrapper.findAll('[data-password-error]').length).toBe(1)

        wrapper.vm.resetValidation()

        await Vue.nextTick()

        expect(wrapper.findAll('[data-username-error]').length).toBe(0)
        expect(wrapper.findAll('[data-password-error]').length).toBe(0)
    })

    test('local errors are reset when errors prop cleared', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { fieldsErrors: { input: ['failure'] } },
            slots: {
                default: `
                    <FormularioField v-slot="{ context }" name="input">
                        <span v-for="error in context.allErrors">{{ error.message }}</span>
                    </FormularioField>
                `,
            },
        })

        expect(wrapper.find('span').exists()).toBe(true)

        wrapper.setProps({ fieldsErrors: {} })

        await Vue.nextTick()

        expect(wrapper.find('span').exists()).toBe(false)
    })
})
