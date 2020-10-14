import Formulario from '@/index.ts'

describe('Formulario', () => {
    it('installs on vue instance', () => {
        const components = [
            'FormularioForm',
            'FormularioInput',
            'FormularioGrouping',
        ]
        const registry = []
        function Vue () {}
        Vue.component = function (name, instance) {
            registry.push(name)
        }
        Formulario.install(Vue)
        expect(Vue.prototype.$formulario).toBe(Formulario)
        expect(registry).toEqual(components)
    })

    it('can extend instance in a plugin', () => {
        function Vue () {}
        Vue.component = function (name, instance) {}
        const plugin = function (i) {
            i.extend({
                rules: {
                    testRule: () => false
                }
            })
        }
        Formulario.install(Vue, {
            plugins: [ plugin ]
        })

        expect(typeof Vue.prototype.$formulario.options.rules.testRule).toBe('function')
    })
})
