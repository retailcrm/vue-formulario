import Vue from 'vue'
import flushPromises from 'flush-promises'
import { mount } from '@vue/test-utils'

import Formulario from '@/index.ts'
import FormularioField from '@/FormularioField.vue'
import FormularioForm from '@/FormularioForm.vue'

const globalRule = jest.fn(() => false)

Vue.use(Formulario, {
    validationRules: { globalRule },
    validationMessages: {
        required: () => 'required',
        'in': () => 'in',
        min: () => 'min',
        globalRule: () => 'globalRule',
    },
})

describe('FormularioField', () => {
    const createWrapper = (props = {}) => mount(FormularioField, {
        propsData: {
            name: 'field',
            value: 'initial',
            validation: 'required|in:abcdef',
            validationMessages: { in: 'the value was different than expected' },
            ...props,
        },
        scopedSlots: {
            default: `
                <div>
                    <input type="text" v-model="props.context.model">
                    <span v-for="(violation, index) in props.context.violations" :key="index" data-violation>
                        {{ violation.message }}
                    </span>
                </div>
            `,
        },
    })

    test('allows custom field-rule level validation strings', async () => {
        const wrapper = createWrapper({
            validationBehavior: 'live',
        })

        await flushPromises()

        expect(wrapper.find('[data-violation]').text()).toBe(
            'the value was different than expected'
        )
    })

    test.each([
        ['demand'],
        ['submit'],
    ])('no validation when validationBehavior is not "live"', async validationBehavior => {
        const wrapper = createWrapper({ validationBehavior })

        await flushPromises()

        expect(wrapper.find('[data-violation]').exists()).toBe(false)

        wrapper.find('input').element['value'] = 'updated'
        wrapper.find('input').trigger('change')

        await flushPromises()

        expect(wrapper.find('input').element['value']).toBe('updated')
        expect(wrapper.find('[data-violation]').exists()).toBe(false)
    })

    test('allows custom validation rule message', async () => {
        const wrapper = createWrapper({
            value: 'other value',
            validationMessages: { in: ({ value }) => `the string "${value}" is not correct` },
            validationBehavior: 'live',
        })

        await flushPromises()

        expect(wrapper.find('[data-violation]').text()).toBe(
            'the string "other value" is not correct'
        )
    })

    test.each([
        ['bar', ({ value }) => value === 'foo'],
        ['bar', ({ value }) => Promise.resolve(value === 'foo')],
    ])('uses local custom validation rules', async (value, rule) => {
        const wrapper = createWrapper({
            value,
            validation: 'required|custom',
            validationRules: { custom: rule },
            validationMessages: { custom: 'failed the custom rule check' },
            validationBehavior: 'live',
        })

        await flushPromises()

        expect(wrapper.find('[data-violation]').text()).toBe('failed the custom rule check')
    })

    test('uses global custom validation rules', async () => {
        mount(FormularioField, {
            propsData: {
                name: 'test',
                value: 'bar',
                validation: 'required|globalRule',
                validationBehavior: 'live',
            },
        })

        await flushPromises()

        expect(globalRule.mock.calls.length).toBe(1)
    })

    test('emits correct validation event', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'field',
                value: '',
                validation: 'required',
                validationBehavior: 'live',
            },
        })

        await flushPromises()

        expect(wrapper.emitted('validation')).toEqual([[{
            name: 'field',
            violations: [{
                rule: 'required',
                args: expect.any(Array),
                context: {
                    name: 'field',
                    value: '',
                    formValues: {},
                },
                message: expect.any(String),
            }],
        }]])
    })

    test.each([
        ['bail|required|in:xyz', 1],
        ['^required|in:xyz|min:10,length', 1],
        ['required|^in:xyz|min:10,length', 2],
        ['required|in:xyz|bail', 2],
    ])('prevents further validation if not passed a rule with bail modifier', async (
        validation,
        expectedViolationsCount
    ) => {
        const wrapper = createWrapper({
            value: '',
            validation,
            validationBehavior: 'live',
        })

        await flushPromises()

        expect(wrapper.findAll('[data-violation]').length).toBe(expectedViolationsCount)
    })

    test('proceeds validation if passed a rule with bail modifier', async () => {
        const wrapper = createWrapper({
            value: '123',
            validation: '^required|in:xyz|min:10,length',
            validationBehavior: 'live',
        })

        await flushPromises()

        expect(wrapper.findAll('[data-violation]').length).toBe(2)
    })

    test('displays errors when validation-behavior is submit and form is submitted', async () => {
        const wrapper = mount(FormularioForm, {
            slots: {
                default: `
                    <FormularioField
                        v-slot="{ context }"
                        name="field"
                        validation="required"
                        validation-behavior="submit"
                    >
                        <span v-for="(violation, index) in context.violations" :key="index" data-violation>
                            {{ violation.message }}
                        </span>
                    </FormularioField>
                `
            }
        })

        await flushPromises()

        expect(wrapper.find('[data-violation]').exists()).toBe(false)

        wrapper.trigger('submit')

        await flushPromises()

        expect(wrapper.find('[data-violation]').exists()).toBe(true)
    })

    test('model getter for input', async () => {
        const wrapper = mount({
            data: () => ({ state: { date: 'not a date' } }),
            template: `
                <FormularioForm v-model="state">
                    <FormularioField
                        v-slot="{ context }"
                        :model-get-converter="onGet"
                        name="date"
                    >
                        <span data-output>{{ context.model }}</span>
                    </FormularioField>
                </FormularioForm>
            `,
            methods: {
                onGet (source) {
                    return source instanceof Date ? source.getDate() : 'invalid date'
                },
            }
        })

        await flushPromises()

        expect(wrapper.find('[data-output]').text()).toBe('invalid date')

        wrapper.vm.state = { date: new Date('1995-12-17') }

        await flushPromises()

        expect(wrapper.find('[data-output]').text()).toBe('17')
    })

    test('model setter for input', async () => {
        const wrapper = mount({
            data: () => ({ state: { date: 'not a date' } }),
            template: `
                <FormularioForm v-model="state">
                    <FormularioField
                        v-slot="{ context }"
                        :model-get-converter="onGet"
                        :model-set-converter="onSet"
                        name="date"
                    >
                        <input type="text" v-model="context.model">
                    </FormularioField>
                </FormularioForm>
            `,
            methods: {
                onGet (source) {
                    return source instanceof Date ? source.getDate() : source
                },

                onSet (source) {
                    if (source instanceof Date) {
                        return source
                    }

                    if (isNaN(source)) {
                        return undefined
                    }

                    const result = new Date('2001-05-01')
                    result.setDate(source)

                    return result
                },
            }
        })

        await flushPromises()

        wrapper.find('input').setValue('12')
        wrapper.find('input').trigger('input')

        await flushPromises()

        const form = wrapper.findComponent(FormularioForm)

        expect(form.emitted('input')).toEqual([
            [{}],
            [{ date: new Date('2001-05-12') }],
        ])
    })
})
