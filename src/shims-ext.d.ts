import Formulario from '@/Formulario'

declare module 'vue/types/vue' {
    interface Vue {
        $formulario: Formulario;
        $route: VueRoute;
        $t: Function;
        $tc: Function;
    }

    interface VueRoute {
        path: string;
    }

    interface FormularioForm extends Vue {
        name: string | boolean;
        proxy: Record<string, any>;
        hasValidationErrors(): Promise<boolean>;
    }
}
