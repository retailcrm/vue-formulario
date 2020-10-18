import Vue from 'vue'
import Formulario from '@/Formulario.ts'

Vue.mixin({
    methods: {
        $t (text) {
            return text
        }
    }
})
Vue.use(new Formulario())
