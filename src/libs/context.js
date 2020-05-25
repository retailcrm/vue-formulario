import { map, arrayify, shallowEqualObjects } from './utils'

/**
 * For a single instance of an input, export all of the context needed to fully
 * render that element.
 * @return {object}
 */
export default {
    context () {
        return defineModel.call(this, {
            attributes: this.elementAttributes,
            blurHandler: blurHandler.bind(this),
            disableErrors: this.disableErrors,
            errors: this.explicitErrors,
            allErrors: this.allErrors,
            formShouldShowErrors: this.formShouldShowErrors,
            getValidationErrors: this.getValidationErrors.bind(this),
            hasGivenName: this.hasGivenName,
            hasValidationErrors: this.hasValidationErrors.bind(this),
            help: this.help,
            id: this.id || this.defaultId,
            imageBehavior: this.imageBehavior,
            limit: this.limit,
            name: this.nameOrFallback,
            performValidation: this.performValidation.bind(this),
            preventWindowDrops: this.preventWindowDrops,
            repeatable: this.repeatable,
            setErrors: this.setErrors.bind(this),
            showValidationErrors: this.showValidationErrors,
            uploadBehavior: this.uploadBehavior,
            uploadUrl: this.mergedUploadUrl,
            uploader: this.uploader || this.$formulario.getUploader(),
            validationErrors: this.validationErrors,
            value: this.value,
            visibleValidationErrors: this.visibleValidationErrors,
        })
    },
    // Used in sub-context
    nameOrFallback,
    hasGivenName,
    elementAttributes,
    mergedUploadUrl,

    // These items are not passed as context
    isVmodeled,
    mergedValidationName,
    explicitErrors,
    allErrors,
    hasErrors,
    hasVisibleErrors,
    showValidationErrors,
    visibleValidationErrors
}

/**
 * Reducer for attributes that will be applied to each core input element.
 * @return {object}
 */
function elementAttributes () {
    const attrs = Object.assign({}, this.localAttributes)
    // pass the ID prop through to the root element
    if (this.id) {
        attrs.id = this.id
    } else {
        attrs.id = this.defaultId
    }
    // pass an explicitly given name prop through to the root element
    if (this.hasGivenName) {
        attrs.name = this.name
    }

    // If there is help text, have this element be described by it.
    if (this.help) {
        attrs['aria-describedby'] = `${attrs.id}-help`
    }

    return attrs
}

/**
 * The validation label to use.
 */
function mergedValidationName () {
    if (this.validationName) {
        return this.validationName
    }

    return this.name
}

/**
 * Use the uploadURL on the input if it exists, otherwise use the uploadURL
 * that is defined as a plugin option.
 */
function mergedUploadUrl () {
    return this.uploadUrl || this.$formulario.getUploadUrl()
}

/**
 * Determines if the field should show it's error (if it has one)
 * @return {boolean}
 */
function showValidationErrors () {
    if (this.showErrors || this.formShouldShowErrors) {
        return true
    }

    return this.behavioralErrorVisibility
}

/**
 * All of the currently visible validation errors (does not include error handling)
 * @return {array}
 */
function visibleValidationErrors () {
    return (this.showValidationErrors && this.validationErrors.length) ? this.validationErrors : []
}

/**
 * Return the element’s name, or select a fallback.
 */
function nameOrFallback () {
    if (this.path !== '') {
        return this.path + '.' + this.name
    }

    return this.name
}

/**
 * determine if an input has a user-defined name
 */
function hasGivenName () {
    return typeof this.name !== 'boolean'
}

/**
 * Determines if this formulario element is v-modeled or not.
 */
function isVmodeled () {
    return !!(this.$options.propsData.hasOwnProperty('formularioValue') &&
        this._events &&
        Array.isArray(this._events.input) &&
        this._events.input.length)
}

/**
 * Given an object or array of options, create an array of objects with label,
 * value, and id.
 * @param {array|object}
 * @return {array}
 */
function createOptionList (options) {
    if (!Array.isArray(options) && options && typeof options === 'object') {
        const optionList = []
        const that = this
        for (const value in options) {
            optionList.push({ value, label: options[value], id: `${that.elementAttributes.id}_${value}` })
        }
        return optionList
    }
    return options
}

/**
 * These are errors we that have been explicity passed to us.
 */
function explicitErrors () {
    let result = arrayify(this.errors)
        .concat(this.localErrors)
        .concat(arrayify(this.error))
    result = result.map(message => ({'message': message, 'rule': null, 'context': null}))

    return result;
}

/**
 * The merged errors computed property.
 * Each error is an object with fields message (translated message), rule (rule name) and context
 */
function allErrors () {
    return this.explicitErrors
        .concat(arrayify(this.validationErrors))
}

/**
 * Does this computed property have errors
 */
function hasErrors () {
    return !!this.allErrors.length
}

/**
 * Returns if form has actively visible errors (of any kind)
 */
function hasVisibleErrors () {
    return ((this.validationErrors && this.showValidationErrors) || !!this.explicitErrors.length)
}

/**
 * Bound into the context object.
 */
function blurHandler () {
    this.$emit('blur')
    if (this.errorBehavior === 'blur') {
        this.behavioralErrorVisibility = true
    }
}

/**
 * Defines the model used throughout the existing context.
 * @param {object} context
 */
function defineModel (context) {
    return Object.defineProperty(context, 'model', {
        get: modelGetter.bind(this),
        set: modelSetter.bind(this)
    })
}

/**
 * Get the value from a model.
 **/
function modelGetter () {
    const model = this.isVmodeled ? 'formularioValue' : 'proxy'
    if (this[model] === undefined) {
        return ''
    }
    return this[model]
}

/**
 * Set the value from a model.
 **/
function modelSetter (value) {
    if (!shallowEqualObjects(value, this.proxy)) {
        this.proxy = value
    }
    this.$emit('input', value)
    if (this.context.name && typeof this.formularioSetter === 'function') {
        this.formularioSetter(this.context.name, value)
    }
}
