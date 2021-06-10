import { VueConstructor } from 'vue'

import Formulario, { FormularioOptions } from '@/Formulario.ts'

import FormularioField from '@/FormularioField.vue'
import FormularioFieldGroup from '@/FormularioFieldGroup.vue'
import FormularioForm from '@/FormularioForm.vue'

export default {
    Formulario,
    install (Vue: VueConstructor, options?: FormularioOptions): void {
        Vue.component('FormularioField', FormularioField)
        Vue.component('FormularioFieldGroup', FormularioFieldGroup)
        Vue.component('FormularioForm', FormularioForm)

        // @deprecated Use FormularioField instead
        Vue.component('FormularioInput', FormularioField)
        // @deprecated Use FormularioFieldGroup instead
        Vue.component('FormularioGrouping', FormularioFieldGroup)

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
