import Vue from 'vue'
import flushPromises from 'flush-promises'
import { mount } from '@vue/test-utils'

import Formulario from '@/index.ts'
import FormularioForm from '@/FormularioForm.vue'
import FormularioInput from '@/FormularioInput.vue'

const globalRule = jest.fn(() => { return false })

function validationMessages (instance) {
    instance.extend({
        validationMessages: {
            required: () => 'required',
            'in': () => 'in',
            min: () => 'min',
            globalRule: () => 'globalRule',
        }
    })
}

Vue.use(Formulario, {
    plugins: [validationMessages],
    rules: { globalRule }
})

describe('FormularioInput', () => {
    it('allows custom field-rule level validation strings', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                errorBehavior: 'live',
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            },
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('the value was different than expected')
    })

    it('no validation on created when errorBehavior is not live', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('no validation on value change when errorBehavior is not live', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                errorBehavior: 'submit',
                value: 'other value'
            },
            scopedSlots: {
                default: `<div>
                    <input type="text" v-model="props.context.model">
                    <span v-for="error in props.context.allErrors">{{ error.message }}</span>
                </div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)

        const input = wrapper.find('input[type="text"]')
        input.element.value = 'test'
        input.trigger('input')
        await flushPromises()
        expect(wrapper.find('input[type="text"]').element.value).toBe('test')
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('allows custom field-rule level validation functions', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: { in: ({ value }) => `The string ${value} is not correct.` },
                errorBehavior: 'live',
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('The string other value is not correct.')
    })

    it('no validation on created when errorBehavior is not live', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('uses custom async validation rules on defined on the field', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|foobar',
                validationMessages: {
                    foobar: 'failed the foobar check'
                },
                validationRules: {
                    foobar: async ({ value }) => value === 'foo'
                },
                errorBehavior: 'live',
                value: 'bar'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('failed the foobar check')
    })

    it('uses custom sync validation rules on defined on the field', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|foobar',
                validationMessages: {
                    foobar: 'failed the foobar check'
                },
                validationRules: {
                    foobar: ({ value }) => value === 'foo'
                },
                errorBehavior: 'live',
                value: 'bar'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.allErrors">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('failed the foobar check')
    })

    it('uses global custom validation rules', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                name: 'test',
                validation: 'required|globalRule',
                errorBehavior: 'live',
                value: 'bar'
            }
        })
        await flushPromises()
        expect(globalRule.mock.calls.length).toBe(1)
    })

    it('emits correct validation event', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                validation: 'required',
                errorBehavior: 'live',
                value: '',
                name: 'testinput',
            }
        })
        await flushPromises()
        const errorObject = wrapper.emitted('validation')[0][0]
        expect(errorObject).toEqual({
            name: 'testinput',
            errors: [
                {
                    message: expect.any(String),
                    rule: expect.stringContaining('required'),
                    context: expect.any(Object)
                }
            ],
            hasErrors: true
        })
    })

    it('emits a error-visibility event on blur', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                validation: 'required',
                errorBehavior: 'blur',
                value: '',
                name: 'testinput',
            },
            scopedSlots: {
                default: `<input type="text" v-model="props.context.model" @blur="props.context.blurHandler">`
            }
        })
        await flushPromises()
        expect(wrapper.emitted('error-visibility')[0][0]).toBe(false)
        wrapper.find('input[type="text"]').trigger('blur')
        await flushPromises()
        expect(wrapper.emitted('error-visibility')[1][0]).toBe(true)
    })

    it('emits error-visibility event immediately when live', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                validation: 'required',
                errorBehavior: 'live',
                value: '',
                name: 'testinput',
            }
        })
        await flushPromises()
        expect(wrapper.emitted('error-visibility').length).toBe(1)
    })

    it('Does not emit an error-visibility event if visibility did not change', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                validation: 'in:xyz',
                errorBehavior: 'live',
                value: 'bar',
                name: 'testinput',
            },
            scopedSlots: {
                default: `<input type="text" v-model="props.context.model">`
            }
        })
        await flushPromises()
        expect(wrapper.emitted('error-visibility').length).toBe(1)
        wrapper.find('input[type="text"]').setValue('bar')
        await flushPromises()
        expect(wrapper.emitted('error-visibility').length).toBe(1)
    })

    it('can bail on validation when encountering the bail rule', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: { name: 'test', validation: 'bail|required|in:xyz', errorBehavior: 'live' }
        })
        await flushPromises();
        expect(wrapper.vm.context.visibleValidationErrors.length).toBe(1);
    })

    it('can show multiple validation errors if they occur before the bail rule', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: { name: 'test', validation: 'required|in:xyz|bail', errorBehavior: 'live' }
        })
        await flushPromises();
        expect(wrapper.vm.context.visibleValidationErrors.length).toBe(2);
    })

    it('can avoid bail behavior by using modifier', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: { name: 'test', validation: '^required|in:xyz|min:10,length', errorBehavior: 'live', value: '123' }
        })
        await flushPromises();
        expect(wrapper.vm.context.visibleValidationErrors.length).toBe(2);
    })

    it('prevents later error messages when modified rule fails', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: { name: 'test', validation: '^required|in:xyz|min:10,length', errorBehavior: 'live' }
        })
        await flushPromises();
        expect(wrapper.vm.context.visibleValidationErrors.length).toBe(1);
    })

    it('can bail in the middle of the rule set with a modifier', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: { name: 'test', validation: 'required|^in:xyz|min:10,length', errorBehavior: 'live' }
        })
        await flushPromises();
        expect(wrapper.vm.context.visibleValidationErrors.length).toBe(2);
    })

    it('does not show errors on blur when set error-behavior is submit', async () => {
        const wrapper = mount(FormularioInput, {
            propsData: {
                validation: 'required',
                errorBehavior: 'submit',
                name: 'test',
            },
            scopedSlots: {
                default: `
                    <div>
                        <input v-model="props.context.model" @blur="props.context.blurHandler">
                        <span v-if="props.context.formShouldShowErrors" v-for="error in props.context.allErrors">{{ error.message }}</span>
                    </div>
                `
            }
        })

        expect(wrapper.find('span').exists()).toBe(false)
        wrapper.find('input').trigger('input')
        wrapper.find('input').trigger('blur')
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('displays errors when error-behavior is submit and form is submitted', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { name: 'test' },
            slots: {
                default: `
                    <FormularioInput v-slot="inputProps" validation="required" name="testinput" error-behavior="submit">
                        <span v-for="error in inputProps.context.allErrors">{{ error.message }}</span>
                    </FormularioInput>
                `
            }
        })

        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)

        wrapper.trigger('submit')

        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(true)
    })
})
