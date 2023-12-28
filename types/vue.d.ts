import type { Vue, VueConstructor } from 'vue/types/vue'

export type DefineComponent<Props, Methods> = VueConstructor<Vue & Required<Props> & Methods>
