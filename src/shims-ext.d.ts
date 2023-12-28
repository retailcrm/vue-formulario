import Formulario from '@/Formulario'

declare module 'vue/types/vue' {
    interface Vue {
        $formulario: Formulario;
        $t: any;
        $tc: any;
    }
}
