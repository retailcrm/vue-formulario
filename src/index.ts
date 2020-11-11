import Formulario, { FormularioOptions } from '@/Formulario.ts'
import { VueConstructor } from 'vue'
import FormularioForm from '@/FormularioForm.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'
import FormularioInput from '@/FormularioInput.vue'

export default {
    install (Vue: VueConstructor, options?: FormularioOptions): void {
        Vue.component('FormularioForm', FormularioForm)
        Vue.component('FormularioGrouping', FormularioGrouping)
        Vue.component('FormularioInput', FormularioInput)

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
