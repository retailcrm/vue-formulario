import './bootstrap.scss'

import { storiesOf } from '@storybook/vue'

import Vue from 'vue'
import VueFormulario from '@/index.ts'

import ExampleAddressList from './ExampleAddressList.tale'

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

storiesOf('Examples', module)
    .add('Address list', () => ExampleAddressList)
