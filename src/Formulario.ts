import { VueConstructor } from 'vue'
import isPlainObject from 'is-plain-object'

import library from '@/libs/library'
import rules from '@/validation/rules'
import mimes from '@/libs/mimes'
import FileUpload from '@/FileUpload'
import RuleValidationMessages from '@/RuleValidationMessages'
import { arrayify, has } from '@/libs/utils'
import fauxUploader from '@/libs/faux-uploader'

import FormularioForm from '@/FormularioForm.vue'
import FormularioInput from '@/FormularioInput.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'
import { ObjectType } from '@/common.types'
import { ValidationContext } from '@/validation/types'

interface ErrorHandler {
    (error: any, formName?: string): any
}

interface FormularioOptions {
    components?: { [name: string]: VueConstructor }
    plugins?: any[]
    library?: any
    rules?: any
    mimes?: any
    locale?: any
    uploader?: any
    uploadUrl?: any
    fileUrlKey?: any
    errorHandler?: ErrorHandler
    uploadJustCompleteDuration?: any
    validationMessages?: any
    idPrefix?: string
}

// noinspection JSUnusedGlobalSymbols
/**
 * The base formulario library.
 */
export default class Formulario {
    public options: FormularioOptions
    public defaults: FormularioOptions
    public registry: Map<string, FormularioForm>
    public idRegistry: { [name: string]: number }

    /**
     * Instantiate our base options.
     */
    constructor () {
        this.options = {}
        this.defaults = {
            components: {
                FormularioForm,
                FormularioInput,
                FormularioGrouping,
            },
            library,
            rules,
            mimes,
            locale: false,
            uploader: fauxUploader,
            uploadUrl: false,
            fileUrlKey: 'url',
            uploadJustCompleteDuration: 1000,
            errorHandler: (error: any) => error,
            plugins: [RuleValidationMessages],
            validationMessages: {},
            idPrefix: 'formulario-'
        }
        this.registry = new Map()
        this.idRegistry = {}
    }

    /**
     * Install vue formulario, and register it’s components.
     */
    install (Vue: VueConstructor, options?: FormularioOptions) {
        Vue.prototype.$formulario = this
        this.options = this.defaults
        let plugins = this.defaults.plugins as any[]
        if (options && Array.isArray(options.plugins) && options.plugins.length) {
            plugins = plugins.concat(options.plugins)
        }
        plugins.forEach(plugin => (typeof plugin === 'function') ? plugin(this) : null)
        this.extend(options || {})
        for (const componentName in this.options.components) {
            if (Object.prototype.hasOwnProperty.call(this.options.components, componentName)) {
                Vue.component(componentName, this.options.components[componentName])
            }
        }
    }

    /**
     * Produce a deterministically generated id based on the sequence by which it
     * was requested. This should be *theoretically* the same SSR as client side.
     * However, SSR and deterministic ids can be very challenging, so this
     * implementation is open to community review.
     */
    nextId (vm: Vue) {
        const options = this.options as FormularioOptions
        const path = vm.$route && vm.$route.path ? vm.$route.path : false
        const pathPrefix = path ? vm.$route.path.replace(/[/\\.\s]/g, '-') : 'global'
        if (!Object.prototype.hasOwnProperty.call(this.idRegistry, pathPrefix)) {
            this.idRegistry[pathPrefix] = 0
        }
        return `${options.idPrefix}${pathPrefix}-${++this.idRegistry[pathPrefix]}`
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend (extendWith: FormularioOptions) {
        if (typeof extendWith === 'object') {
            this.options = this.merge(this.options as FormularioOptions, extendWith)
            return this
        }
        throw new Error(`VueFormulario extend() should be passed an object (was ${typeof extendWith})`)
    }

    /**
     * Create a new object by copying properties of base and mergeWith.
     * Note: arrays don't overwrite - they push
     *
     * @param {Object} base
     * @param {Object} mergeWith
     * @param {boolean} concatArrays
     */
    merge (base: ObjectType, mergeWith: ObjectType, concatArrays: boolean = true) {
        const merged: ObjectType = {}

        for (const key in base) {
            if (has(mergeWith, key)) {
                if (isPlainObject(mergeWith[key]) && isPlainObject(base[key])) {
                    merged[key] = this.merge(base[key], mergeWith[key], concatArrays)
                } else if (concatArrays && Array.isArray(base[key]) && Array.isArray(mergeWith[key])) {
                    merged[key] = base[key].concat(mergeWith[key])
                } else {
                    merged[key] = mergeWith[key]
                }
            } else {
                merged[key] = base[key]
            }
        }

        for (const prop in mergeWith) {
            if (!has(merged, prop)) {
                merged[prop] = mergeWith[prop]
            }
        }

        return merged
    }

    /**
     * Determine what "class" of input this element is given the "type".
     */
    classify (type: string) {
        if (has(this.options.library, type)) {
            return this.options.library[type].classification
        }

        return 'unknown'
    }

    /**
     * Determine what type of component to render given the "type".
     */
    component (type: string) {
        if (has(this.options.library, type)) {
            return this.options.library[type].component
        }

        return false
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     */
    rules (rules: Object = {}) {
        return { ...this.options.rules, ...rules }
    }

    /**
     * Get the validation message for a particular error.
     */
    validationMessage (rule: string, context: ValidationContext, vm: Vue) {
        if (has(this.options.validationMessages, rule)) {
            return this.options.validationMessages[rule](vm, context)
        } else {
            return this.options.validationMessages.default(vm, context)
        }
    }

    /**
     * Given an instance of a FormularioForm register it.
     */
    register (form: FormularioForm) {
        // @ts-ignore
        if (form.$options.name === 'FormularioForm' && form.name) {
            // @ts-ignore
            this.registry.set(form.name, form)
        }
    }

    /**
     * Given an instance of a form, remove it from the registry.
     */
    deregister (form: FormularioForm) {
        if (
            form.$options.name === 'FormularioForm' &&
            // @ts-ignore
            form.name &&
            // @ts-ignore
            this.registry.has(form.name as string)
        ) {
            // @ts-ignore
            this.registry.delete(form.name as string)
        }
    }

    /**
     * Given an array, this function will attempt to make sense of the given error
     * and hydrate a form with the resulting errors.
     */
    handle (error: any, formName: string, skip: boolean = false) {
        // @ts-ignore
        const e = skip ? error : this.options.errorHandler(error, formName)
        if (formName && this.registry.has(formName)) {
            const form = this.registry.get(formName) as FormularioForm
            // @ts-ignore
            form.applyErrors({
                formErrors: arrayify(e.formErrors),
                inputErrors: e.inputErrors || {}
            })
        }
        return e
    }

    /**
     * Reset a form.
     */
    reset (formName: string, initialValue: Object = {}) {
        this.resetValidation(formName)
        this.setValues(formName, initialValue)
    }

    /**
     * Reset the form's validation messages.
     */
    resetValidation (formName: string) {
        const form = this.registry.get(formName) as FormularioForm
        // @ts-ignore
        form.hideErrors(formName)
        // @ts-ignore
        form.namedErrors = []
        // @ts-ignore
        form.namedFieldErrors = {}
    }

    /**
     * Set the form values.
     */
    setValues (formName: string, values?: ObjectType) {
        if (values) {
            const form = this.registry.get(formName) as FormularioForm
            // @ts-ignore
            form.setValues({ ...values })
        }
    }

    /**
     * Get the file uploader.
     */
    getUploader () {
        return this.options.uploader || false
    }

    /**
     * Get the global upload url.
     */
    getUploadUrl () {
        return this.options.uploadUrl || false
    }

    /**
     * When re-hydrating a file uploader with an array, get the sub-object key to
     * access the url of the file. Usually this is just "url".
     */
    getFileUrlKey () {
        return this.options.fileUrlKey || 'url'
    }

    /**
     * Create a new instance of an upload.
     */
    createUpload (data: DataTransfer, context: ObjectType) {
        return new FileUpload(data, context, this.options)
    }
}
