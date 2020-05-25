import library from './libs/library'
import rules from './libs/rules'
import mimes from './libs/mimes'
import FileUpload from './FileUpload'
import RuleValidationMessages from './RuleValidationMessages'
import { arrayify, parseLocale, has } from './libs/utils'
import isPlainObject from 'is-plain-object'
import fauxUploader from './libs/faux-uploader'
import FormularioForm from './FormularioForm.vue'
import FormularioInput from './FormularioInput.vue'
import FormularioGrouping from './FormularioGrouping.vue'

/**
 * The base formulario library.
 */
class Formulario {
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
            errorHandler: (err) => err,
            plugins: [ RuleValidationMessages ],
            validationMessages: {},
            idPrefix: 'formulario-'
        }
        this.registry = new Map()
        this.idRegistry = {}
    }

    /**
     * Install vue formulario, and register it’s components.
     */
    install (Vue, options) {
        Vue.prototype.$formulario = this
        this.options = this.defaults
        var plugins = this.defaults.plugins
        if (options && Array.isArray(options.plugins) && options.plugins.length) {
          plugins = plugins.concat(options.plugins)
        }
        plugins.forEach(plugin => (typeof plugin === 'function') ? plugin(this) : null)
        this.extend(options || {})
        for (var componentName in this.options.components) {
            Vue.component(componentName, this.options.components[componentName])
        }
    }

    /**
     * Produce a deterministically generated id based on the sequence by which it
     * was requested. This should be *theoretically* the same SSR as client side.
     * However, SSR and deterministic ids can be very challenging, so this
     * implementation is open to community review.
     */
    nextId (vm) {
        const path = vm.$route && vm.$route.path ? vm.$route.path : false
        const pathPrefix = path ? vm.$route.path.replace(/[/\\.\s]/g, '-') : 'global'
        if (!Object.prototype.hasOwnProperty.call(this.idRegistry, pathPrefix)) {
            this.idRegistry[pathPrefix] = 0
        }
        return `${this.options.idPrefix}${pathPrefix}-${++this.idRegistry[pathPrefix]}`
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     * @param {Object} extendWith
     */
    extend (extendWith) {
        if (typeof extendWith === 'object') {
            this.options = this.merge(this.options, extendWith)
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
    merge (base, mergeWith, concatArrays = true) {
        var merged = {}
        for (var key in base) {
            if (mergeWith.hasOwnProperty(key)) {
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
        for (var prop in mergeWith) {
            if (!merged.hasOwnProperty(prop)) {
                merged[prop] = mergeWith[prop]
            }
        }
        return merged
    }

    /**
     * Determine what "class" of input this element is given the "type".
     * @param {string} type
     */
    classify (type) {
        if (this.options.library.hasOwnProperty(type)) {
            return this.options.library[type].classification
        }
        return 'unknown'
    }

    /**
     * Determine what type of component to render given the "type".
     * @param {string} type
     */
    component (type) {
        if (this.options.library.hasOwnProperty(type)) {
            return this.options.library[type].component
        }
        return false
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     * @return {object} object of validation functions
     */
    rules (rules = {}) {
        return { ...this.options.rules, ...rules }
    }

    /**
     * Get the validation message for a particular error.
     */
    validationMessage (rule, validationContext, vm) {
        if (this.options.validationMessages.hasOwnProperty(rule)) {
            return this.options.validationMessages[rule](vm, validationContext)
        } else {
            return this.options.validationMessages['default'](vm, validationContext)
        }
    }

    /**
     * Given an instance of a FormularioForm register it.
     * @param {vm} form
     */
    register (form) {
        if (form.$options.name === 'FormularioForm' && form.name) {
            this.registry.set(form.name, form)
        }
    }

    /**
     * Given an instance of a form, remove it from the registry.
     * @param {vm} form
     */
    deregister (form) {
        if (
            form.$options.name === 'FormularioForm' &&
            form.name &&
            this.registry.has(form.name)
        ) {
            this.registry.delete(form.name)
        }
    }

    /**
     * Given an array, this function will attempt to make sense of the given error
     * and hydrate a form with the resulting errors.
     *
     * @param {error} err
     * @param {string} formName
     * @param {error}
     */
    handle (err, formName, skip = false) {
        const e = skip ? err : this.options.errorHandler(err, formName)
        if (formName && this.registry.has(formName)) {
            this.registry.get(formName).applyErrors({
                formErrors: arrayify(e.formErrors),
                inputErrors: e.inputErrors || {}
            })
        }
        return e
    }

    /**
     * Reset a form.
     * @param {string} formName
     * @param {object} initialValue
     */
    reset (formName, initialValue = {}) {
        this.resetValidation(formName)
        this.setValues(formName, initialValue)
    }

    /**
     * Reset the form's validation messages.
     * @param {string} formName
     */
    resetValidation (formName) {
        const form = this.registry.get(formName)
        form.hideErrors(formName)
        form.namedErrors = []
        form.namedFieldErrors = {}
    }

    /**
     * Set the form values.
     * @param {string} formName
     * @param {object} values
     */
    setValues (formName, values) {
        if (values && !Array.isArray(values) && typeof values === 'object') {
            const form = this.registry.get(formName)
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
    createUpload (fileList, context) {
        return new FileUpload(fileList, context, this.options)
    }
}

export default new Formulario()
