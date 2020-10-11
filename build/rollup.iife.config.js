import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import internal from 'rollup-plugin-internal'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import vue from 'rollup-plugin-vue'

// noinspection JSUnusedGlobalSymbols
export default {
    input: 'src/index.ts',
    output: {
        name: 'VueFormulario',
        exports: 'default',
        format: 'iife',
        globals: {
            'is-plain-object': 'isPlainObject',
            'is-url': 'isUrl',
            'nanoid/non-secure': 'nanoid',
            vue: 'Vue',
            'vue-property-decorator': 'vuePropertyDecorator',
        },
    },
    external: ['vue', 'vue-property-decorator'],
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        typescript({ check: false, sourceMap: false }),
        vue({ css: true, compileTemplate: true }),
        alias({ entries: [{ find: /^@\/(.+)/, replacement: './$1' }] }),
        commonjs(),
        internal(['is-plain-object', 'nanoid/non-secure', 'is-url']),
        terser(),
    ]
}
