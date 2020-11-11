import { createLocalVue, mount } from '@vue/test-utils'
import Formulario from '@/Formulario.ts'
import plugin from '@/index.ts'

describe('Formulario', () => {
    it('Installs on vue instance', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)

        expect(localVue.component('FormularioForm')).toBeTruthy()
        expect(localVue.component('FormularioGrouping')).toBeTruthy()
        expect(localVue.component('FormularioInput')).toBeTruthy()

        const wrapper = mount({ template: '<div />', }, { localVue })

        expect(wrapper.vm.$formulario).toBeInstanceOf(Formulario)
    })

    it ('Pushes Formulario instance to child a component', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)
        localVue.component('TestComponent', {
            render (h) {
                return h('div')
            }
        })

        const wrapper = mount({
            render (h) {
                return h('div', [h('TestComponent', { ref: 'test'  })])
            },
        }, { localVue })

        expect(wrapper.vm.$formulario === wrapper.vm.$refs.test.$formulario).toBe(true)
    })

    it ('Does not pushes Formulario instance to a child component, if it has its own', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)
        // noinspection JSCheckFunctionSignatures
        localVue.component('TestComponent', {
            formulario () {
                return new Formulario()
            },

            render (h) {
                return h('div')
            },
        })

        const wrapper = mount({
            render (h) {
                return h('div', [h('TestComponent', { ref: 'test'  })])
            },
        }, { localVue })

        expect(wrapper.vm.$formulario === wrapper.vm.$refs.test.$formulario).toBe(false)
    })
})
