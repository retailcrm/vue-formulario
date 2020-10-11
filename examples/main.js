import Vue from 'vue'
import VueFormulario from '@/index.ts'
import FormulateSpecimens from './FormulateSpecimens.vue'

Vue.config.productionTip = false
Vue.use(VueFormulario)

new Vue({
    render: h => h(FormulateSpecimens)
}).$mount('#app')
