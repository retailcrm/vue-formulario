import { configure } from '@storybook/vue'

const req = require.context('../stories/', true, /.stories.js$/)

configure(() => {
    req.keys().forEach(filename => req(filename))
}, module)
