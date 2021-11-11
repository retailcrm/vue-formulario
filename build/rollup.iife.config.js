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
        format: 'iife',
        globals: {
            'is-url': 'isUrl',
            vue: 'Vue',
            'vue-property-decorator': 'vuePropertyDecorator',
        },
    },
    external: ['vue'],
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        typescript({ sourceMap: false }),
        vue({ css: true, compileTemplate: true }),
        alias({ entries: [{ find: /^@\/(.+)/, replacement: './$1' }] }),
        commonjs(),
        internal(['is-url', 'vue-property-decorator']),
        terser(),
    ]
}
