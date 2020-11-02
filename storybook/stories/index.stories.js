import './bootstrap.scss'

import { storiesOf } from '@storybook/vue'

import Vue from 'vue'
import VueFormulario from '../../dist/formulario.esm'

import FormularioGroupingTale from './FormularioGrouping.tale'
import FormularioInputTale from './FormularioInput.tale'

Vue.mixin({
    methods: {
        $t (text) {
            return text
        },
        $tc (text) {
            return text
        }
    }
})
Vue.use(VueFormulario)

storiesOf('FormularioInput', module)
    .add('Default', () => FormularioInputTale)
    .add('Grouping', () => FormularioGroupingTale)
