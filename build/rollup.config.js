import alias from '@rollup/plugin-alias'
import autoExternal from 'rollup-plugin-auto-external'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import vue from 'rollup-plugin-vue'

// noinspection JSUnusedGlobalSymbols
export default {
    input: 'src/index.ts',
    output: [{
        name: 'Formulario',
        globals: {
            'is-url': 'isUrl',
            vue: 'Vue',
            'vue-property-decorator': 'vuePropertyDecorator',
        },
        sourcemap: false,
    }],
    external: ['vue', 'vue-property-decorator'],
    plugins: [
        typescript({ sourceMap: false }),
        vue({ css: true, compileTemplate: true }),
        alias({ entries: [{ find: /^@\/(.+)/, replacement: './$1' }] }),
        commonjs(),
        autoExternal(),
    ]
}
