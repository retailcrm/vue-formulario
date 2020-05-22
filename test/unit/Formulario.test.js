import Formulario from '@/Formulario.js'

describe('Formulario', () => {
    it('can merge simple object', () => {
        let a = {
            optionA: true,
            optionB: '1234'
        }
        let b = {
            optionA: false
        }
        expect(Formulario.merge(a, b)).toEqual({
            optionA: false,
            optionB: '1234'
        })
    })

    it('can add to simple array', () => {
        let a = {
            optionA: true,
            optionB: ['first', 'second']
        }
        let b = {
            optionB: ['third']
        }
        expect(Formulario.merge(a, b, true)).toEqual({
            optionA: true,
            optionB: ['first', 'second', 'third']
        })
    })

    it('can merge recursively', () => {
        let a = {
            optionA: true,
            optionC: {
                first: '123',
                third: {
                    a: 'b'
                }
            },
            optionB: '1234'
        }
        let b = {
            optionB: '567',
            optionC: {
                first: '1234',
                second: '789',
            }
        }
        expect(Formulario.merge(a, b)).toEqual({
            optionA: true,
            optionC: {
                first: '1234',
                third: {
                    a: 'b'
                },
                second: '789'
            },
            optionB: '567'
        })
    })

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
        Formulario.install(Vue, { extended: true })
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
