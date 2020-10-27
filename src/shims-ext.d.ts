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
}
