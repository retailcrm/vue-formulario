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

    it('Registers its subcomponents', () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { testinput: 'has initial value' } },
            slots: {
                default: `
                    <FormularioInput type="text" name="subinput1" />
                    <FormularioInput type="checkbox" name="subinput2" />
                `
            }
        })
        expect(wrapper.vm.registry.keys()).toEqual(['subinput1', 'subinput2'])
    })

    it('deregisters a subcomponents', async () => {
        const wrapper = mount({
            data () {
                return {
                    active: true
                }
            },
            template: `
                <FormularioForm>
                    <FormularioInput v-if="active" type="text" name="subinput1" />
                    <FormularioInput type="checkbox" name="subinput2" />
                </FormularioForm>
            `
        })
        await flushPromises()
        expect(wrapper.findComponent(FormularioForm).vm.registry.keys()).toEqual(['subinput1', 'subinput2'])
        wrapper.setData({ active: false })
        await flushPromises()
        expect(wrapper.findComponent(FormularioForm).vm.registry.keys()).toEqual(['subinput2'])
    })

    it('can set a field’s initial value', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { testinput: 'has initial value' } },
            slots: { default: `
                <FormularioInput v-slot="inputProps" validation="required|in:bar" name="testinput" >
                    <input v-model="inputProps.context.model" type="text">
                </FormularioInput>
            ` }
        })
        await flushPromises()
        expect(wrapper.find('input').element.value).toBe('has initial value')
    })

    it('lets individual fields override form initial value', () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { testinput: 'has initial value' } },
            slots: { default: `
                <FormularioInput v-slot="inputProps" formulario-value="123" name="testinput" >
                    <input v-model="inputProps.context.model" type="text">
                </FormularioInput>
            ` }
        })
        expect(wrapper.find('input').element.value).toBe('123')
    })

    it('lets fields set form initial value with value prop', () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {}
                }
            },
            template: `<FormularioForm v-model="formValues">
                <FormularioInput name="name" value="123" />
            </FormularioForm>`
        })
        expect(wrapper.vm.formValues).toEqual({ name: '123' })
    })

    it('receives updates to form model when individual fields are edited', () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {
                        testinput: '',
                    }
                }
            },
            template: `
                <FormularioForm v-model="formValues">
                    <FormularioInput v-slot="inputProps" name="testinput" >
                        <input v-model="inputProps.context.model" type="text">
                    </FormularioInput>
                </FormularioForm>
            `
        })
        wrapper.find('input').setValue('edited value')
        expect(wrapper.vm.formValues).toEqual({ testinput: 'edited value' })
    })

    it('field data updates when it is type of date', async () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {
                        testdate: new Date(123),
                    }
                }
            },
            template: `
                <FormularioForm v-model="formValues" ref="form">
                    <FormularioInput v-slot="inputProps" name="testdate" >
                        <span v-if="inputProps.context.model">{{ inputProps.context.model.getTime() }}</span>
                    </FormularioInput>
                </FormularioForm>
            `
        })
        expect(wrapper.find('span').text()).toBe('123')

        wrapper.setData({ formValues: { testdate: new Date(234) } })
        await flushPromises()

        expect(wrapper.find('span').text()).toBe('234')
    })

    // ===========================================================================
    /**
     * @todo in vue-test-utils version 1.0.0-beta.29 has some bugs related to
     * synchronous updating. Some details are here:
     *
     * @update this test was re-implemented in version 1.0.0-beta.31 and seems to
     * be workign now with flushPromises(). Leaving these docs here for now.
     *
     * https://github.com/vuejs/vue-test-utils/issues/1130
     *
     * This test is being commented out until there is a resolution on this issue,
     * and instead being replaced with a mock call.
     */

    it('updates initial form values when input contains a populated v-model', async () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {
                        testinput: '',
                    },
                    fieldValue: '123'
                }
            },
            template: `
                <FormularioForm v-model="formValues">
                    <FormularioInput type="text" name="testinput" v-model="fieldValue" />
                </FormularioForm>
            `
        })
        await flushPromises()
        expect(wrapper.vm.formValues).toEqual({ testinput: '123' })
    })

    // ===========================================================================

    // Replacement test for the above test - not quite as good of a test.
    it('updates calls setFieldValue on form when a field contains a populated v-model on registration', () => {
        const wrapper = mount(FormularioForm, {
            propsData: {
                formularioValue: { testinput: '123' }
            },
            slots: {
                default: '<FormularioInput type="text" name="testinput" formulario-value="override-data" />'
            }
        })
        expect(wrapper.emitted().input[wrapper.emitted().input.length - 1]).toEqual([{ testinput: 'override-data' }])
    })

    it('updates an inputs value when the form v-model is modified', async () => {
        const wrapper = mount({
            data () {
                return {
                    formValues: {
                        testinput: 'abcd',
                    }
                }
            },
            template: `
                <FormularioForm v-model="formValues">
                    <FormularioInput v-slot="inputProps" name="testinput" >
                        <input v-model="inputProps.context.model" type="text">
                    </FormularioInput>
                </FormularioForm>
            `
        })
        await flushPromises()
        wrapper.vm.formValues = { testinput: '1234' }
        await flushPromises()
        expect(wrapper.find('input[type="text"]').element.value).toBe('1234')
    })

    it('resolves hasValidationErrors to true', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: '<FormularioInput type="text" validation="required" name="fieldName" />' }
        })
        wrapper.find('form').trigger('submit')
        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['error']).toBeTruthy()
        expect(emitted['error'].length).toBe(1)
    })

    it('Resolves submitted form values to an object', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: '<FormularioInput type="text" validation="required" name="fieldName" value="Justin" />' }
        })
        wrapper.find('form').trigger('submit')
        await flushPromises()

        const emitted = wrapper.emitted()

        expect(emitted['submit']).toBeTruthy()
        expect(emitted['submit'].length).toBe(1)
        expect(emitted['submit'][0]).toStrictEqual([{ fieldName: 'Justin' }])
    })

    it('accepts a values prop and uses it to set the initial values', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { values: { name: 'Dave Barnett', candy: true } },
            slots: { default: `
                <FormularioInput v-slot="{ context }" name="name" validation="required">
                    <input v-model="context.model" type="text">
                </FormularioInput>
            ` }
        })
        await flushPromises()
        expect(wrapper.find('input[type="text"]').element.value).toBe('Dave Barnett')
    })

    it('automatically registers with root plugin', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formularioValue: { box3: [] }, name: 'login' }
        })
        expect(wrapper.vm.$formulario.registry.has('login')).toBe(true)
        expect(wrapper.vm.$formulario.registry.get('login')).toBe(wrapper.vm)
    })

    it('Calls custom error handler with error and name', async () => {
        const wrapper = mount({
            template: `
            <div>
                <FormularioForm name="login" />
                <FormularioForm name="register" />
            </div>
            `
        })
        wrapper.vm.$formulario.handle({ formErrors: ['This is an error message'] }, 'login')
    })

    it('Errors are displayed on correctly named components', async () => {
        const wrapper = mount({
            template: `
            <div>
                <FormularioForm
                    class="form form--login"
                    name="login"
                    v-slot="{ errors }"
                >
                    <span v-for="error in errors" class="error">{{ error }}</span>
                </FormularioForm>
                <FormularioForm
                    class="form form--register"
                    name="register"
                    v-slot="{ errors }"
                >
                    <span v-for="error in errors" class="error">{{ error }}</span>
                </FormularioForm>
            </div>
            `
        })
        expect(
            wrapper.vm.$formulario.registry.has('login') &&
            wrapper.vm.$formulario.registry.has('register')
        ).toBe(true)
        wrapper.vm.$formulario.handle({ formErrors: ['This is an error message'] }, 'login')
        await flushPromises()
        expect(wrapper.findAll('.form').length).toBe(2)
        expect(wrapper.find('.form--login .error').exists()).toBe(true)
        expect(wrapper.find('.form--register .error').exists()).toBe(false)
    })

    it('receives a form-errors prop and displays it', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { name: 'main', formErrors: ['first', 'second'] },
            scopedSlots: {
                default: `
                    <div>
                        <span v-for="error in props.formErrors">{{ error }}</span>
                        <FormularioInput name="name" />
                    </div>
                `
            }
        })
        await flushPromises()
        expect(wrapper.vm.$formulario.registry.get('main').mergedFormErrors.length).toBe(2)
    })

    it('it aggregates form-errors prop with form-named errors', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { formErrors: ['first', 'second'], name: 'login' }
        })
        wrapper.vm.$formulario.handle({ formErrors: ['third'] }, 'login')
        await flushPromises()

        let errors = wrapper.vm.$formulario.registry.get('login').mergedFormErrors
        expect(Object.keys(errors).length).toBe(3)
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

    return

    it('is able to display multiple errors on multiple elements', async () => {
        const wrapper = mount({
            template: `
                <FormularioForm
                    name="register"
                    :errors="{inputA: ['first', 'second'], inputB: 'only one here', inputC: ['and one here']}"
                >
                    <FormularioInput name="inputA" />
                    <FormularioInput name="inputB" type="textarea" />
                    <FormularioInput name="inputC" type="checkbox" />
                </FormularioForm>
                `
        })
        await wrapper.vm.$nextTick()

        let errors = wrapper.vm.$formulario.registry.get('register').mergedFieldErrors
        expect(Object.keys(errors).length).toBe(3)
        expect(errors.inputA.length).toBe(2)
        expect(errors.inputB.length).toBe(1)
        expect(errors.inputC.length).toBe(1)
    })

    it('it can set multiple field errors with handle()', async () => {
        const wrapper = mount({
            template: `
                <FormularioForm name="register">
                    <FormularioInput name="inputA" />
                    <FormularioInput name="inputB" type="textarea" />
                    <FormularioInput name="inputC" type="checkbox" />
                </FormularioForm>
                `
        })

        let errors = wrapper.vm.$formulario.registry.get('register').mergedFieldErrors
        expect(Object.keys(errors).length).toBe(0)

        wrapper.vm.$formulario.handle({ inputErrors: {inputA: ['first', 'second'], inputB: 'only one here', inputC: ['and one here']} }, "register")
        await wrapper.vm.$nextTick()
        await flushPromises()

        errors = wrapper.vm.$formulario.registry.get('register').mergedFieldErrors
        expect(Object.keys(errors).length).toBe(3)
        expect(errors.inputA.length).toBe(2)
        expect(errors.inputB.length).toBe(1)
        expect(errors.inputC.length).toBe(1)

    })

    it('emits correct validation event on entry', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: `
                <div>
                    <FormularioInput v-slot="inputProps" validation="required|in:bar" name="testinput" >
                        <input v-model="inputProps.context.model" type="text">
                    </FormularioInput>
                    <FormularioInput type="radio" validation="required" name="bar" />
                </div>
            ` }
        })
        wrapper.find('input[type="text"]').setValue('foo')
        await flushPromises()
        const errorObjects = wrapper.emitted('validation')
        // There should be 3 events, both inputs mounting, and the value being set removing required on testinput
        expect(errorObjects.length).toBe(3)
        // this should be the event from the setValue()
        const errorObject = errorObjects[2][0]
        expect(errorObject).toEqual({
            name: 'testinput',
            errors: [
                expect.any(String)
            ],
            hasErrors: true
        })
    })

    it('emits correct validation event when no errors', async () => {
        const wrapper = mount(FormularioForm, {
            slots: { default: `
                <div>
                    <FormularioInput v-slot="inputProps" validation="required|in:bar" name="testinput" >
                        <input v-model="inputProps.context.model" type="text">
                    </FormularioInput>
                    <FormularioInput type="radio" validation="required" name="bar" />
                </div>
            ` }
        })
        wrapper.find('input[type="text"]').setValue('bar')
        await flushPromises()
        const errorObjects = wrapper.emitted('validation')
        expect(errorObjects.length).toBe(3)
        const errorObject = errorObjects[2][0]
        expect(errorObject).toEqual({
            name: 'testinput',
            errors: [],
            hasErrors: false
        })
    })

    it('removes field data when that field is de-registered', async () => {
        const wrapper = mount({
            template: `
                <FormularioForm
                    v-model="formData"
                >
                    <FormularioInput v-slot="inputProps" name="foo">
                        <input v-model="inputProps.context.model" type="text" value="abc123">
                    </FormularioInput>
                    <FormularioInput type="checkbox" name="bar" v-if="formData.foo !== 'bar'" :value="1" />
                </FormularioForm>
            `,
            data () {
                return {
                    formData: {}
                }
            }
        })
        await flushPromises()
        wrapper.find('input[type="text"]').setValue('bar')
        await flushPromises()
        expect(wrapper.findComponent(FormularioForm).vm.proxy).toEqual({ foo: 'bar' })
        expect(wrapper.vm.formData).toEqual({ foo: 'bar' })
    })

    it('it allows resetting a form, hiding validation and clearing inputs.', async () => {
        const wrapper = mount({
            template: `
                <FormularioForm
                    v-model="formData"
                    name="login"
                    ref="form"
                >
                    <FormularioInput v-slot="inputProps" name="username" validation="required">
                        <input v-model="inputProps.context.model" type="text">
                    </FormularioInput>
                    <FormularioInput v-slot="inputProps" name="password" validation="required|min:4,length">
                        <input v-model="inputProps.context.model" type="password">
                    </FormularioInput>
                </FormularioForm>
            `,
            data () {
                return {
                    formData: {}
                }
            }
        })
        const password = wrapper.find('input[type="password"]')
        password.setValue('foo')
        password.trigger('blur')
        wrapper.find('form').trigger('submit')
        wrapper.vm.$formulario.handle({
            inputErrors: { username: ['Failed'] }
        }, 'login')
        await flushPromises()
        // First make sure we caugth the errors
        expect(Object.keys(wrapper.vm.$refs.form.mergedFieldErrors).length).toBe(1)
        wrapper.vm.$formulario.reset('login')
        await flushPromises()
        expect(Object.keys(wrapper.vm.$refs.form.mergedFieldErrors).length).toBe(0)
        expect(wrapper.vm.formData).toEqual({})
    })
})
