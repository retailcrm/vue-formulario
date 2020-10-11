import autoExternal from 'rollup-plugin-auto-external'
import buble from '@rollup/plugin-buble' // Transpile/polyfill with reasonable browser support
import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import vue from 'rollup-plugin-vue'

// noinspection JSUnusedGlobalSymbols
export default {
    input: 'src/index.ts',
    output: [{
        name: 'Formulario',
        exports: 'default',
        globals: {
            'is-plain-object': 'isPlainObject',
            'is-url': 'isUrl',
            'nanoid/non-secure': 'nanoid',
        },
        sourcemap: false,
    }],
    external: ['nanoid/non-secure'],
    plugins: [
        commonjs(),
        autoExternal(),
        typescript({ sourceMap: false }),
        vue({
            css: true, // Dynamically inject css as a <style> tag
            compileTemplate: true // Explicitly convert template to render function
        }),
        buble({
            objectAssign: 'Object.assign',
        }), // Transpile to ES5,
        terser(),
    ]
}
