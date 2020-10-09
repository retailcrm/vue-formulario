import Vue from 'vue'
import VueFormulario from '../src/Formulario'
import FormulateSpecimens from './FormulateSpecimens.vue'

Vue.config.productionTip = false
Vue.use(VueFormulario)

new Vue({
    render: h => h(FormulateSpecimens)
}).$mount('#app')
