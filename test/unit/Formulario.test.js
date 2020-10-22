import Formulario from '@/index.ts'

describe('Formulario', () => {
    it('Installs on vue instance', () => {
        const registry = []
        function Vue () {}
        Vue.component = function (name, instance) {
            registry.push(name)
        }
        Formulario.install(Vue)
        expect(Vue.prototype.$formulario).toBe(Formulario)
        expect(registry).toEqual([
            'FormularioForm',
            'FormularioGrouping',
            'FormularioInput',
        ])
    })
})
