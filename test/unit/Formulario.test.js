import { createLocalVue, mount } from '@vue/test-utils'
import Formulario from '@/Formulario.ts'
import plugin from '@/index.ts'

describe('Formulario', () => {
    it('installs on vue instance', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)

        expect(localVue.component('FormularioField')).toBeTruthy()
        expect(localVue.component('FormularioFieldGroup')).toBeTruthy()
        expect(localVue.component('FormularioForm')).toBeTruthy()

        const wrapper = mount({ render: h => h('div'), }, { localVue })

        expect(wrapper.vm.$formulario).toBeInstanceOf(Formulario)
    })

    it ('pushes Formulario instance to child a component', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)

        const ChildComponent = localVue.component('ChildComponent', {
            render: h => h('div'),
        })

        const parent = mount({
            render: h => h('div', [h('ChildComponent')]),
        }, { localVue })

        const child = parent.findComponent(ChildComponent)

        expect(parent.vm.$formulario === child.vm.$formulario).toBe(true)
    })

    it ('does not push Formulario instance to a child component, if it has its own', () => {
        const localVue = createLocalVue()

        localVue.use(plugin)
        // noinspection JSCheckFunctionSignatures
        const ChildComponent = localVue.component('ChildComponent', {
            formulario: () => new Formulario(),
            render: h => h('div'),
        })

        const parent = mount({
            render: h => h('div', [h('ChildComponent')]),
        }, { localVue })

        const child = parent.findComponent(ChildComponent)

        expect(parent.vm.$formulario === child.vm.$formulario).toBe(false)
    })
})
