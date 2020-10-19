import './bootstrap.scss'

import { storiesOf } from '@storybook/vue'

import Vue from 'vue'
import Formulario from '@/Formulario.ts'

import FormularioGroupingTale from './FormularioGrouping.tale'
import FormularioInputTale from './FormularioInput.tale'

Vue.mixin({
    methods: {
        $t (text) {
            return text
        }
    }
})
Vue.use(new Formulario())

storiesOf('FormularioInput', module)
    .add('Default', () => FormularioInputTale)
    .add('Grouping', () => FormularioGroupingTale)
