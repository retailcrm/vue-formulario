import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import buble from '@rollup/plugin-buble' // Transpile/polyfill with reasonable browser support
import internal from 'rollup-plugin-internal'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import vue from 'rollup-plugin-vue' // Handle .vue SFC files

// noinspection JSUnusedGlobalSymbols
export default {
    input: 'src/index.ts', // Path relative to package.json
    output: {
        name: 'VueFormulario',
        exports: 'default',
        format: 'iife',
        globals: {
            'is-plain-object': 'isPlainObject',
            'is-url': 'isUrl',
            'nanoid/non-secure': 'nanoid',
        },
    },
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs(),
        internal(['is-plain-object', 'nanoid/non-secure', 'is-url']),
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
