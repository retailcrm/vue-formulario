// noinspection JSUnusedGlobalSymbols

import type { Vue } from 'vue/types/vue'
import type { PluginObject } from 'vue/types/plugin'

import type { DefineComponent } from './types/vue'

import type { FormularioFormConstructor } from './types/form'

import type {
    ModelGetConverter,
    ModelSetConverter,
    ValidationBehaviour,
    UnregisterBehaviour,
} from './types/field'

import type {
    ValidationMessageFn,
    ValidationMessageI18NFn,
    ValidationRuleFn,
    Violation,
} from './types/validation'

import type { Options } from './types/plugin'

declare const FormularioForm: FormularioFormConstructor

export { FormularioForm }

declare const FormularioField: DefineComponent<{
    name: string;
    value?: unknown;
    validation?: string|any[];
    /** Defaults to 'demand' */
    validationBehavior?: ValidationBehaviour;
    validationRules?: Record<string, ValidationRuleFn>;
    validationMessages?: Record<string, ValidationMessageI18NFn|string>;
    errorsDisabled?: boolean;
    modelGetConverter?: ModelGetConverter;
    modelSetConverter?: ModelSetConverter;
    /** Defaults to 'none' */
    unregisterBehavior?: UnregisterBehaviour;
    tag?: string;
}, {
    runValidation(): Promise<Violation[]>;
    hasValidationErrors (): Promise<boolean>;
    /** @internal */
    resetValidation(): void;
}>

export { FormularioField }

declare class Formulario {
    public validationRules: Record<string, ValidationRuleFn>;
    public validationMessages: Record<string, ValidationMessageI18NFn|string>;

    constructor (options?: Options);

    /** Given a set of options, apply them to the pre-existing options. */
    public extend (extendWith: Options): Formulario;

    public runValidation (id: string): Promise<Record<string, Violation[]>>;

    public resetValidation (id: string): void;

    /** Used by forms instances to add themselves into a registry */
    public register (id: string, form: InstanceType<FormularioFormConstructor>): void;

    /** Used by forms instances to remove themselves from a registry */
    public unregister (id: string): void;

    /** Get validation rules by merging any passed in with global rules. */
    public getRules (extendWith: Record<string, ValidationRuleFn> = {}): Record<string, ValidationRuleFn>;

    /** Get validation messages by merging any passed in with global messages. */
    public getMessages (
        vm: Vue,
        extendWith: Record<string, ValidationMessageI18NFn|string>
    ): Record<string, ValidationMessageFn>;
}

export { Formulario }

declare module 'vue/types/vue' {
    interface Vue {
        readonly $formulario: Formulario;
    }
}

declare const VueFormulario: PluginObject<Options> & {
    Formulario: Formulario,
}

export default VueFormulario
