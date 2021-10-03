import type { VueConstructor } from 'vue'
import type { Options } from '../types/plugin'

import Formulario from '@/Formulario'

import FormularioField from '@/FormularioField.vue'
import FormularioFieldGroup from '@/FormularioFieldGroup.vue'
import FormularioForm from '@/FormularioForm.vue'

export {
    Formulario,
    FormularioField,
    FormularioFieldGroup,
    FormularioForm,
}

export default {
    Formulario,
    install (Vue: VueConstructor, options?: Options): void {
        Vue.component('FormularioField', FormularioField)
        Vue.component('FormularioFieldGroup', FormularioFieldGroup)
        Vue.component('FormularioForm', FormularioForm)

        Vue.mixin({
            beforeCreate () {
                const o = this.$options as Record<string, any>

                if (typeof o.formulario === 'function') {
                    this.$formulario = o.formulario()
                } else if (o.parent && o.parent.$formulario) {
                    this.$formulario = o.parent.$formulario
                } else {
                    this.$formulario = new Formulario(options)
                }
            }
        })
    },
}
