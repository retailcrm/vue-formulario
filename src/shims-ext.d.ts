import Formulario from '@/Formulario'

declare module 'vue/types/vue' {
    interface VueRoute {
        path: string
    }

    interface Vue {
        $formulario: Formulario,
        $route: VueRoute,
        $t: Function,
        $tc: Function,
    }

    interface FormularioForm extends Vue {
        name: string | boolean
        proxy: Object
        hasValidationErrors(): Promise<boolean>
    }
}
