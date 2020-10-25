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
    it('render a form DOM element', () => {
        const wrapper = mount(FormularioForm)
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('accepts a default slot', () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: '<div class="default-slot-item" />'
            }
        })
        expect(wrapper.find('form div.default-slot-item').exists()).toBe(true)
    })

    it('Intercepts submit event', () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: '<button type="submit" />'
            }
        })
        const spy = jest.spyOn(wrapper.vm, 'onFormSubmit')
        wrapper.find('form').trigger('submit')
        expect(spy).toHaveBeenCalled()
    })

    it('Adds subcomponents to the registry', () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: {} },
            slots: {
                default: `
                    <FormularioInput name="sub1" />
                    <FormularioInput name="sub2" />
                `
            }
        })
        expect(wrapper.vm.registry.keys()).toEqual(['sub1', 'sub2'])
    })

    it('Removes subcomponents from the registry', async () => {
        const wrapper = mount({
            data: () => ({ active: true }),
            template: `
                <FormularioForm>
                    <FormularioInput v-if="active" name="sub1" />
                    <FormularioInput name="sub2" />
                </FormularioForm>
            `
        })
        await flushPromises()
        expect(wrapper.findComponent(FormularioForm).vm.registry.keys()).toEqual(['sub1', 'sub2'])
        wrapper.setData({ active: false })
        await flushPromises()
        expect(wrapper.findComponent(FormularioForm).vm.registry.keys()).toEqual(['sub2'])
    })

    it('Can set a field’s initial value', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { test: 'Has initial value' } },
            slots: {
                default: `
                    <FormularioInput v-slot="{ context }" validation="required|in:bar" name="test" >
                        <input v-model="context.model" type="text">
                    </FormularioInput>
                `
            }
        })
        await flushPromises()
        expect(wrapper.find('input').element['value']).toBe('Has initial value')
    })

    it('Lets individual fields override form initial value', () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { test: 'has initial value' } },
            slots: {
                default: `
                    <FormularioInput v-slot="{ context }" name="test" value="123">
                        <input v-model="context.model" type="text">
                    </FormularioInput>
                `
            }
        })
        expect(wrapper.find('input').element['value']).toBe('123')
    })

    it('Lets fields set form initial value with value prop', () => {
        const wrapper = mount({
            data: () => ({ values: {} }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioInput name="test" value="123" />
                </FormularioForm>
            `
        })
        expect(wrapper.vm['values']).toEqual({ test: '123' })
    })

    it('Receives updates to form model when individual fields are edited', () => {
        const wrapper = mount({
            data: () => ({ values: { test: '' } }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioInput v-slot="{ context }" name="test" >
                        <input v-model="context.model" type="text">
                    </FormularioInput>
                </FormularioForm>
            `
        })
        wrapper.find('input').setValue('Edited value')
        expect(wrapper.vm['values']).toEqual({ test: 'Edited value' })
    })

    it('Field data updates when it is type of date', async () => {
        const wrapper = mount({
            data: () => ({ formValues: { date: new Date(123) } }),
            template: `
                <FormularioForm v-model="formValues" ref="form">
                    <FormularioInput v-slot="{ context }" name="date" >
                        <span v-if="context.model">{{ context.model.getTime() }}</span>
                    </FormularioInput>
                </FormularioForm>
            `
        })

        expect(wrapper.find('span').text()).toBe('123')

        wrapper.setData({ formValues: { date: new Date(234) } })
        await flushPromises()

        expect(wrapper.find('span').text()).toBe('234')
    })

    it('Updates initial form values when input contains a populated v-model', async () => {
        const wrapper = mount({
            data: () => ({
                formValues: {  test: '' },
                fieldValue: '123',
            }),
            template: `
                <FormularioForm v-model="formValues">
                    <FormularioInput name="test" v-model="fieldValue" />
                </FormularioForm>
            `
        })
        await flushPromises()
        expect(wrapper.vm['formValues']).toEqual({ test: '123' })
    })

    // Replacement test for the above test - not quite as good of a test.
    it('Updates calls setFieldValue on form when a field contains a populated v-model on registration', () => {
        const wrapper = mount(FormularioForm, {
            propsData: {
                formularioValue: { test: 'Initial' }
            },
            slots: {
                default: '<FormularioInput name="test" value="Overrides" />'
            },
        })

        const emitted = wrapper.emitted('input')

        expect(emitted).toBeTruthy()
        expect(emitted[emitted.length - 1]).toEqual([{ test: 'Overrides' }])
    })

    it('updates an inputs value when the form v-model is modified', async () => {
        const wrapper = mount({
            data: () => ({ values: { test: 'abcd' } }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioInput v-slot="{ context }" name="test" >
                        <input v-model="context.model" type="text">
                    </FormularioInput>
                </FormularioForm>
            `
        })

        wrapper.vm.values = { test: '1234' }

        await flushPromises()

        const input = wrapper.find('input[type="text"]')

        expect(input).toBeTruthy()
        expect(input.element['value']).toBe('1234')
    })

    it('Resolves hasValidationErrors to true', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: '<FormularioInput name="fieldName" validation="required" />' }
        })
        wrapper.find('form').trigger('submit')
        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['error']).toBeTruthy()
        expect(emitted['error'].length).toBe(1)
    })

    it('Resolves submitted form values to an object', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: '<FormularioInput name="fieldName" validation="required" value="Justin" />' }
        })
        wrapper.find('form').trigger('submit')
        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['submit']).toBeTruthy()
        expect(emitted['submit'].length).toBe(1)
        expect(emitted['submit'][0]).toEqual([{ fieldName: 'Justin' }])
    })

    it('Receives a form-errors prop and displays it', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formErrors: ['first', 'second'] },
        })
        await flushPromises()
        expect(wrapper.vm.mergedFormErrors.length).toBe(2)
    })

    it('Aggregates form-errors prop with form-named errors', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formErrors: ['first', 'second'] }
        })
        wrapper.vm.setErrors({ formErrors: ['third'] })

        await flushPromises()

        expect(Object.keys(wrapper.vm.mergedFormErrors).length).toBe(3)
    })

    it('displays field errors on inputs with errors prop', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { errors: { fieldWithErrors: ['This field has an error'] }},
            slots: {
                default: `
                    <FormularioInput v-slot="{ context }" name="fieldWithErrors">
                        <span v-for="error in context.allErrors">{{ error.message }}</span>
                    </FormularioInput>
                `
            }
        })
        await wrapper.vm.$nextTick()

        expect(wrapper.find('span').exists()).toBe(true)
        expect(wrapper.find('span').text()).toEqual('This field has an error')
    })

    it('Is able to display multiple errors on multiple elements', async () => {
        const errors = { inputA: ['first'], inputB: ['first', 'second']}
        const wrapper = mount(FormularioForm, { propsData: { errors } })

        await wrapper.vm.$nextTick()

        expect(Object.keys(wrapper.vm.mergedFieldErrors).length).toBe(2)
        expect(wrapper.vm.mergedFieldErrors.inputA.length).toBe(1)
        expect(wrapper.vm.mergedFieldErrors.inputB.length).toBe(2)
    })

    it('Can set multiple field errors with setErrors()', async () => {
        const wrapper = mount(FormularioForm)

        expect(Object.keys(wrapper.vm.mergedFieldErrors).length).toBe(0)

        wrapper.vm.setErrors({
            inputErrors: {
                inputA: ['first'],
                inputB: ['first', 'second'],
            }
        })

        await wrapper.vm.$nextTick()
        await flushPromises()

        expect(Object.keys(wrapper.vm.mergedFieldErrors).length).toBe(2)
        expect(wrapper.vm.mergedFieldErrors.inputA.length).toBe(1)
        expect(wrapper.vm.mergedFieldErrors.inputB.length).toBe(2)
    })

    it('Emits correct validation event when no errors', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <FormularioInput v-slot="{ context }" name="foo" validation="required|in:foo">
                        <input v-model="context.model" type="text" @blur="context.blurHandler">
                    </FormularioInput>
                    <FormularioInput name="bar" validation="required" />
                `,
            }
        })
        wrapper.find('input[type="text"]').setValue('foo')
        wrapper.find('input[type="text"]').trigger('blur')

        await flushPromises()

        expect(wrapper.emitted('validation')).toBeTruthy()
        expect(wrapper.emitted('validation').length).toBe(1)
        expect(wrapper.emitted('validation')[0][0]).toEqual({
            name: 'foo',
            errors: [],
        })
    })

    it('Emits correct validation event on entry', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: `
                <FormularioInput v-slot="{ context }" name="foo" validation="required|in:foo">
                    <input v-model="context.model" type="text" @blur="context.blurHandler">
                </FormularioInput>
                <FormularioInput name="bar" validation="required" />
            ` }
        })
        wrapper.find('input[type="text"]').setValue('bar')
        wrapper.find('input[type="text"]').trigger('blur')

        await flushPromises()

        expect(wrapper.emitted('validation')).toBeTruthy()
        expect(wrapper.emitted('validation').length).toBe(1)
        expect(wrapper.emitted('validation')[0][0]).toEqual({
            name: 'foo',
            errors: [ expect.any(Object) ], // @TODO: Check object structure
        })
    })

    return

    it('Removes field data when that field is de-registered', async () => {
        const wrapper = mount({
            data: () => ({ values: {} }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioInput v-slot="{ context }" name="foo">
                        <input v-model="context.model" type="text" value="abc123">
                    </FormularioInput>
                    <FormularioInput v-if="values.foo !== 'bar'" name="bar" value="1" />
                </FormularioForm>
            `,
        })

        await flushPromises()

        wrapper.find('input[type="text"]').setValue('bar')

        await flushPromises()

        expect(wrapper.findComponent(FormularioForm).vm.proxy).toEqual({ foo: 'bar' })
        expect(wrapper.vm['values']).toEqual({ foo: 'bar' })
    })

    it('Allows resetting a form, hiding validation and clearing inputs.', async () => {
        const wrapper = mount({
            data: () => ({ values: {} }),
            template: `
                <FormularioForm
                    v-model="values"
                    name="login"
                    ref="form"
                >
                    <FormularioInput v-slot="{ context }" name="username" validation="required">
                        <input v-model="context.model" type="text">
                    </FormularioInput>
                    <FormularioInput v-slot="{ context }" name="password" validation="required|min:4,length">
                        <input v-model="context.model" type="password">
                    </FormularioInput>
                </FormularioForm>
            `,
        })

        const password = wrapper.find('input[type="password"]')
        password.setValue('foo')
        password.trigger('blur')

        wrapper.find('form').trigger('submit')
        wrapper.vm.$refs.form.setErrors({ inputErrors: { username: ['Failed'] } })

        await flushPromises()

        // First make sure we caught the errors
        expect(Object.keys(wrapper.vm.$refs.form.mergedFieldErrors).length).toBe(1)
        wrapper.vm.$refs.form.resetValidation()
        wrapper.vm.$refs.form.setValues({ })

        await flushPromises()
        expect(Object.keys(wrapper.vm.$refs.form.mergedFieldErrors).length).toBe(0)
        expect(wrapper.vm.values).toEqual({})
    })
})
