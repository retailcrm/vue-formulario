import isPlainObject from 'is-plain-object';
import isUrl from 'is-url';
import Vue from 'vue';
import { Model, Prop, Provide, Watch, Component, Inject } from 'vue-property-decorator';

/**
 * Shorthand for Object.prototype.hasOwnProperty.call (space saving)
 */
function has(ctx, prop) {
    return Object.prototype.hasOwnProperty.call(ctx, prop);
}

/**
 * Create a new object by copying properties of base and mergeWith.
 * Note: arrays don't overwrite - they push
 *
 * @param {Object} a
 * @param {Object} b
 * @param {boolean} concatArrays
 */
function merge(a, b, concatArrays = true) {
    const merged = {};
    for (const key in a) {
        if (has(b, key)) {
            if (isPlainObject(b[key]) && isPlainObject(a[key])) {
                merged[key] = merge(a[key], b[key], concatArrays);
            }
            else if (concatArrays && Array.isArray(a[key]) && Array.isArray(b[key])) {
                merged[key] = a[key].concat(b[key]);
            }
            else {
                merged[key] = b[key];
            }
        }
        else {
            merged[key] = a[key];
        }
    }
    for (const prop in b) {
        if (!has(merged, prop)) {
            merged[prop] = b[prop];
        }
    }
    return merged;
}

/**
 * Converts to array.
 * If given parameter is not string, object ot array, result will be an empty array.
 * @param {*} item
 */
function arrayify(item) {
    if (!item) {
        return [];
    }
    if (typeof item === 'string') {
        return [item];
    }
    if (Array.isArray(item)) {
        return item;
    }
    if (typeof item === 'object') {
        return Object.values(item);
    }
    return [];
}

function isScalar(data) {
    switch (typeof data) {
        case 'symbol':
        case 'number':
        case 'string':
        case 'boolean':
        case 'undefined':
            return true;
        default:
            return data === null;
    }
}

/**
 * A simple (somewhat non-comprehensive) clone function, valid for our use
 * case of needing to unbind reactive watchers.
 */
function clone(value) {
    if (typeof value !== 'object') {
        return value;
    }
    const copy = Array.isArray(value) ? [] : {};
    for (const key in value) {
        if (has(value, key)) {
            if (isScalar(value[key])) {
                copy[key] = value[key];
            }
            else if (value instanceof Date) {
                copy[key] = new Date(copy[key]);
            }
            else {
                copy[key] = clone(value[key]);
            }
        }
    }
    return copy;
}

/**
 * Escape a string for use in regular expressions.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
/**
 * Given a string format (date) return a regex to match against.
 */
function regexForFormat(format) {
    const escaped = `^${escapeRegExp(format)}$`;
    const formats = {
        MM: '(0[1-9]|1[012])',
        M: '([1-9]|1[012])',
        DD: '([012][1-9]|3[01])',
        D: '([012]?[1-9]|3[01])',
        YYYY: '\\d{4}',
        YY: '\\d{2}'
    };
    return new RegExp(Object.keys(formats).reduce((regex, format) => {
        return regex.replace(format, formats[format]);
    }, escaped));
}

function shallowEqualObjects(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (!objA || !objB) {
        return false;
    }
    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);
    if (bKeys.length !== aKeys.length) {
        return false;
    }
    if (objA instanceof Date && objB instanceof Date) {
        return objA.getTime() === objB.getTime();
    }
    if (aKeys.length === 0) {
        return objA === objB;
    }
    for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i];
        if (objA[key] !== objB[key]) {
            return false;
        }
    }
    return true;
}

/**
 * Given a string, convert snake_case to camelCase
 */
function snakeToCamel(string) {
    return string.replace(/([_][a-z0-9])/ig, ($1) => {
        if (string.indexOf($1) !== 0 && string[string.indexOf($1) - 1] !== '_') {
            return $1.toUpperCase().replace('_', '');
        }
        return $1;
    });
}

function getNested(obj, field) {
    const fieldParts = field.split('.');
    let result = obj;
    for (const key in fieldParts) {
        const matches = fieldParts[key].match(/(.+)\[(\d+)\]$/);
        if (result === undefined) {
            return null;
        }
        if (matches) {
            result = result[matches[1]];
            if (result === undefined) {
                return null;
            }
            result = result[matches[2]];
        }
        else {
            result = result[fieldParts[key]];
        }
    }
    return result;
}
function setNested(obj, field, value) {
    const fieldParts = field.split('.');
    let subProxy = obj;
    for (let i = 0; i < fieldParts.length; i++) {
        const fieldPart = fieldParts[i];
        const matches = fieldPart.match(/(.+)\[(\d+)\]$/);
        if (subProxy === undefined) {
            break;
        }
        if (matches) {
            if (subProxy[matches[1]] === undefined) {
                subProxy[matches[1]] = [];
            }
            subProxy = subProxy[matches[1]];
            if (i === fieldParts.length - 1) {
                subProxy[matches[2]] = value;
                break;
            }
            else {
                subProxy = subProxy[matches[2]];
            }
        }
        else {
            if (subProxy === undefined) {
                break;
            }
            if (i === fieldParts.length - 1) {
                subProxy[fieldPart] = value;
                break;
            }
            else {
                // eslint-disable-next-line max-depth
                if (subProxy[fieldPart] === undefined) {
                    subProxy[fieldPart] = {};
                }
                subProxy = subProxy[fieldPart];
            }
        }
    }
}

const rules = {
    /**
     * Rule: the value must be "yes", "on", "1", or true
     */
    accepted({ value }) {
        return ['yes', 'on', '1', 1, true, 'true'].includes(value);
    },
    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    after({ value }, compare = false) {
        const compareTimestamp = compare !== false ? Date.parse(compare) : Date.now();
        const valueTimestamp = value instanceof Date ? value.getTime() : Date.parse(value);
        return isNaN(valueTimestamp) ? false : (valueTimestamp > compareTimestamp);
    },
    /**
     * Rule: checks if the value is only alpha
     */
    alpha({ value }, set = 'default') {
        const sets = {
            default: /^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z]+$/,
        };
        return typeof value === 'string' && sets[has(sets, set) ? set : 'default'].test(value);
    },
    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric({ value }, set = 'default') {
        const sets = {
            default: /^[a-zA-Z0-9À-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z0-9]+$/
        };
        return typeof value === 'string' && sets[has(sets, set) ? set : 'default'].test(value);
    },
    /**
     * Rule: checks if a value is after a given date. Defaults to current time
     */
    before({ value }, compare = false) {
        const compareTimestamp = compare !== false ? Date.parse(compare) : Date.now();
        const valueTimestamp = value instanceof Date ? value.getTime() : Date.parse(value);
        return isNaN(valueTimestamp) ? false : (valueTimestamp < compareTimestamp);
    },
    /**
     * Rule: checks if the value is between two other values
     */
    between({ value }, from = 0, to = 10, force) {
        if (from === null || to === null || isNaN(from) || isNaN(to)) {
            return false;
        }
        if ((!isNaN(Number(value)) && force !== 'length') || force === 'value') {
            value = Number(value);
            return (value > Number(from) && value < Number(to));
        }
        if (typeof value === 'string' || force === 'length') {
            value = (!isNaN(Number(value)) ? value.toString() : value);
            return value.length > from && value.length < to;
        }
        return false;
    },
    /**
     * Confirm that the value of one field is the same as another, mostly used
     * for password confirmations.
     */
    confirm({ value, formValues, name }, field) {
        let confirmationFieldName = field;
        if (!confirmationFieldName) {
            confirmationFieldName = /_confirm$/.test(name) ? name.substr(0, name.length - 8) : `${name}_confirm`;
        }
        return formValues[confirmationFieldName] === value;
    },
    /**
     * Rule: ensures the value is a date according to Date.parse(), or a format
     * regex.
     */
    date({ value }, format = false) {
        return format ? regexForFormat(format).test(value) : !isNaN(Date.parse(value));
    },
    /**
     * Rule: tests
     */
    email({ value }) {
        if (!value) {
            return true;
        }
        // eslint-disable-next-line
        const isEmail = /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
        return isEmail.test(value);
    },
    /**
     * Rule: Value ends with one of the given Strings
     */
    endsWith({ value }, ...stack) {
        if (!value) {
            return true;
        }
        if (typeof value === 'string') {
            return stack.length === 0 || stack.some(str => value.endsWith(str));
        }
        return false;
    },
    /**
     * Rule: Value is in an array (stack).
     */
    in({ value }, ...stack) {
        return stack.some(item => typeof item === 'object' ? shallowEqualObjects(item, value) : item === value);
    },
    /**
     * Rule: Match the value against a (stack) of patterns or strings
     */
    matches({ value }, ...stack) {
        return !!stack.find(pattern => {
            if (typeof pattern === 'string' && pattern.substr(0, 1) === '/' && pattern.substr(-1) === '/') {
                pattern = new RegExp(pattern.substr(1, pattern.length - 2));
            }
            if (pattern instanceof RegExp) {
                return pattern.test(value);
            }
            return pattern === value;
        });
    },
    /**
     * Check the maximum value of a particular.
     */
    max({ value }, maximum = 10, force) {
        if (Array.isArray(value)) {
            maximum = !isNaN(Number(maximum)) ? Number(maximum) : maximum;
            return value.length <= maximum;
        }
        if ((!isNaN(value) && force !== 'length') || force === 'value') {
            value = !isNaN(value) ? Number(value) : value;
            return value <= maximum;
        }
        if (typeof value === 'string' || (force === 'length')) {
            value = !isNaN(value) ? value.toString() : value;
            return value.length <= maximum;
        }
        return false;
    },
    /**
     * Check the minimum value of a particular.
     */
    min({ value }, minimum = 1, force) {
        if (Array.isArray(value)) {
            minimum = !isNaN(minimum) ? Number(minimum) : minimum;
            return value.length >= minimum;
        }
        if ((!isNaN(value) && force !== 'length') || force === 'value') {
            value = !isNaN(value) ? Number(value) : value;
            return value >= minimum;
        }
        if (typeof value === 'string' || (force === 'length')) {
            value = !isNaN(value) ? value.toString() : value;
            return value.length >= minimum;
        }
        return false;
    },
    /**
     * Rule: Value is not in stack.
     */
    not({ value }, ...stack) {
        return !stack.some(item => typeof item === 'object' ? shallowEqualObjects(item, value) : item === value);
    },
    /**
     * Rule: checks if the value is only alpha numeric
     */
    number({ value }) {
        return String(value).length > 0 && !isNaN(Number(value));
    },
    /**
     * Rule: must be a value
     */
    required({ value }, isRequired = true) {
        if (!isRequired || ['no', 'false'].includes(isRequired)) {
            return true;
        }
        if (Array.isArray(value)) {
            return !!value.length;
        }
        if (typeof value === 'string') {
            return !!value;
        }
        if (typeof value === 'object') {
            return (!value) ? false : !!Object.keys(value).length;
        }
        return true;
    },
    /**
     * Rule: Value starts with one of the given Strings
     */
    startsWith({ value }, ...stack) {
        if (!value) {
            return true;
        }
        if (typeof value === 'string') {
            return stack.length === 0 || stack.some(str => value.startsWith(str));
        }
        return false;
    },
    /**
     * Rule: checks if a string is a valid url
     */
    url({ value }) {
        return isUrl(value);
    },
    /**
     * Rule: not a true rule — more like a compiler flag.
     */
    bail() {
        return true;
    },
};

/**
 * Message builders, names match rules names, see @/validation/rules
 */
const messages = {
    /**
     * Fallback for rules without message builder
     * @param vm
     * @param context
     */
    default(vm, context) {
        return vm.$t('validation.default', context);
    },
    accepted(vm, context) {
        return vm.$t('validation.accepted', context);
    },
    after(vm, context, compare = false) {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.after.compare', context);
        }
        return vm.$t('validation.after.default', context);
    },
    alpha(vm, context) {
        return vm.$t('validation.alpha', context);
    },
    alphanumeric(vm, context) {
        return vm.$t('validation.alphanumeric', context);
    },
    before(vm, context, compare = false) {
        if (typeof compare === 'string' && compare.length) {
            return vm.$t('validation.before.compare', context);
        }
        return vm.$t('validation.before.default', context);
    },
    between(vm, context, from = 0, to = 10, force) {
        const data = Object.assign(Object.assign({}, context), { from, to });
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$t('validation.between.force', data);
        }
        return vm.$t('validation.between.default', data);
    },
    confirm(vm, context) {
        return vm.$t('validation.confirm', context);
    },
    date(vm, context, format = false) {
        if (typeof format === 'string' && format.length) {
            return vm.$t('validation.date.format', context);
        }
        return vm.$t('validation.date.default', context);
    },
    email(vm, context) {
        return vm.$t('validation.email.default', context);
    },
    endsWith(vm, context) {
        return vm.$t('validation.endsWith.default', context);
    },
    in(vm, context) {
        if (typeof context.value === 'string' && context.value) {
            return vm.$t('validation.in.string', context);
        }
        return vm.$t('validation.in.default', context);
    },
    matches(vm, context) {
        return vm.$t('validation.matches.default', context);
    },
    max(vm, context, maximum = 10, force) {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.max.array', maximum, context);
        }
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.max.force', maximum, context);
        }
        return vm.$tc('validation.max.default', maximum, context);
    },
    min(vm, context, minimum = 1, force) {
        if (Array.isArray(context.value)) {
            return vm.$tc('validation.min.array', minimum, context);
        }
        if ((!isNaN(context.value) && force !== 'length') || force === 'value') {
            return vm.$tc('validation.min.force', minimum, context);
        }
        return vm.$tc('validation.min.default', minimum, context);
    },
    not(vm, context) {
        return vm.$t('validation.not.default', context);
    },
    number(vm, context) {
        return vm.$t('validation.number.default', context);
    },
    required(vm, context) {
        return vm.$t('validation.required.default', context);
    },
    startsWith(vm, context) {
        return vm.$t('validation.startsWith.default', context);
    },
    url(vm, context) {
        return vm.$t('validation.url.default', context);
    }
};

/**
 * The base formulario library.
 */
class Formulario {
    constructor(options) {
        this.validationRules = {};
        this.validationMessages = {};
        this.validationRules = rules;
        this.validationMessages = messages;
        this.extend(options || {});
    }
    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend(extendWith) {
        if (typeof extendWith === 'object') {
            this.validationRules = merge(this.validationRules, extendWith.validationRules || {});
            this.validationMessages = merge(this.validationMessages, extendWith.validationMessages || {});
            return this;
        }
        throw new Error(`[Formulario]: Formulario.extend() should be passed an object (was ${typeof extendWith})`);
    }
    /**
     * Get validation rules by merging any passed in with global rules.
     */
    getRules(extendWith = {}) {
        return merge(this.validationRules, extendWith);
    }
    /**
     * Get validation messages by merging any passed in with global messages.
     */
    getMessages(vm, extendWith) {
        const raw = merge(this.validationMessages || {}, extendWith);
        const messages = {};
        for (const name in raw) {
            messages[name] = (context, ...args) => {
                return typeof raw[name] === 'string' ? raw[name] : raw[name](vm, context, ...args);
            };
        }
        return messages;
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

/**
 * Component registry with inherent depth to handle complex nesting. This is
 * important for features such as grouped fields.
 */
class Registry {
    /**
     * Create a new registry of components.
     * @param {FormularioForm} ctx The host vm context of the registry.
     */
    constructor(ctx) {
        this.registry = new Map();
        this.ctx = ctx;
    }
    /**
     * Fully register a component.
     * @param {string} field name of the field.
     * @param {FormularioForm} component the actual component instance.
     */
    add(field, component) {
        if (this.registry.has(field)) {
            return;
        }
        this.registry.set(field, component);
        // @ts-ignore
        const value = getNested(this.ctx.initialValues, field);
        const hasModel = has(component.$options.propsData || {}, 'value');
        // @ts-ignore
        if (!hasModel && this.ctx.hasInitialValue && value !== undefined) {
            // In the case that the form is carrying an initial value and the
            // element is not, set it directly.
            // @ts-ignore
            component.context.model = value;
            // @ts-ignore
        }
        else if (hasModel && !shallowEqualObjects(component.proxy, value)) {
            // In this case, the field is v-modeled or has an initial value and the
            // form has no value or a different value, so use the field value
            // @ts-ignore
            this.ctx.setFieldValueAndEmit(field, component.proxy);
        }
    }
    /**
     * Remove an item from the registry.
     */
    remove(name) {
        this.registry.delete(name);
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _a = this.ctx.proxy, _b = name, value = _a[_b], newProxy = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
        // @ts-ignore
        this.ctx.proxy = newProxy;
    }
    /**
     * Check if the registry has the given key.
     */
    has(key) {
        return this.registry.has(key);
    }
    /**
     * Check if the registry has elements, that equals or nested given key
     */
    hasNested(key) {
        for (const i of this.registry.keys()) {
            if (i === key || i.includes(key + '.')) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get a particular registry value.
     */
    get(key) {
        return this.registry.get(key);
    }
    /**
     * Get registry value for key or nested to given key
     */
    getNested(key) {
        const result = new Map();
        for (const i of this.registry.keys()) {
            const objectKey = key + '.';
            const arrayKey = key + '[';
            if (i === key ||
                i.substring(0, objectKey.length) === objectKey ||
                i.substring(0, arrayKey.length) === arrayKey) {
                result.set(i, this.registry.get(i));
            }
        }
        return result;
    }
    /**
     * Map over the registry (recursively).
     */
    forEach(callback) {
        this.registry.forEach((component, field) => {
            callback(component, field);
        });
    }
    /**
     * Return the keys of the registry.
     */
    keys() {
        return Array.from(this.registry.keys());
    }
    /**
     * Reduce the registry.
     * @param {function} callback
     * @param accumulator
     */
    reduce(callback, accumulator) {
        this.registry.forEach((component, field) => {
            accumulator = callback(accumulator, component, field);
        });
        return accumulator;
    }
}

class ErrorObserverRegistry {
    constructor(observers = []) {
        this.observers = [];
        this.observers = observers;
    }
    add(observer) {
        if (!this.observers.some(o => o.callback === observer.callback)) {
            this.observers.push(observer);
        }
    }
    remove(handler) {
        this.observers = this.observers.filter(o => o.callback !== handler);
    }
    filter(predicate) {
        return new ErrorObserverRegistry(this.observers.filter(predicate));
    }
    some(predicate) {
        return this.observers.some(predicate);
    }
    observe(errors) {
        this.observers.forEach(observer => {
            if (observer.type === 'form') {
                observer.callback(errors);
            }
            else if (observer.field &&
                !Array.isArray(errors)) {
                if (has(errors, observer.field)) {
                    observer.callback(errors[observer.field]);
                }
                else {
                    observer.callback([]);
                }
            }
        });
    }
}

let FormularioForm = class FormularioForm extends Vue {
    constructor() {
        super(...arguments);
        this.path = '';
        this.proxy = {};
        this.registry = new Registry(this);
        this.errorObserverRegistry = new ErrorObserverRegistry();
        // Local error messages are temporal, they wiped each resetValidation call
        this.localFormErrors = [];
        this.localFieldErrors = {};
    }
    get initialValues() {
        if (this.hasModel && typeof this.formularioValue === 'object') {
            // If there is a v-model on the form/group, use those values as first priority
            return Object.assign({}, this.formularioValue); // @todo - use a deep clone to detach reference types
        }
        return {};
    }
    get mergedFormErrors() {
        return [...this.formErrors, ...this.localFormErrors];
    }
    get mergedFieldErrors() {
        return merge(this.errors || {}, this.localFieldErrors);
    }
    get hasModel() {
        return has(this.$options.propsData || {}, 'formularioValue');
    }
    get hasInitialValue() {
        return this.formularioValue && typeof this.formularioValue === 'object';
    }
    onFormularioValueChanged(values) {
        if (this.hasModel && values && typeof values === 'object') {
            this.setValues(values);
        }
    }
    onMergedFormErrorsChanged(errors) {
        this.errorObserverRegistry.filter(o => o.type === 'form').observe(errors);
    }
    onMergedFieldErrorsChanged(errors) {
        this.errorObserverRegistry.filter(o => o.type === 'input').observe(errors);
    }
    created() {
        this.initProxy();
    }
    getFormValues() {
        return this.proxy;
    }
    onFormSubmit() {
        return this.hasValidationErrors()
            .then(hasErrors => hasErrors ? undefined : clone(this.proxy))
            .then(data => {
            if (typeof data !== 'undefined') {
                this.$emit('submit', data);
            }
            else {
                this.$emit('error');
            }
        });
    }
    onFormularioFieldValidation(payload) {
        this.$emit('validation', payload);
    }
    addErrorObserver(observer) {
        this.errorObserverRegistry.add(observer);
        if (observer.type === 'form') {
            observer.callback(this.mergedFormErrors);
        }
        else if (observer.field && has(this.mergedFieldErrors, observer.field)) {
            observer.callback(this.mergedFieldErrors[observer.field]);
        }
    }
    removeErrorObserver(observer) {
        this.errorObserverRegistry.remove(observer);
    }
    register(field, component) {
        this.registry.add(field, component);
    }
    deregister(field) {
        this.registry.remove(field);
    }
    initProxy() {
        if (this.hasInitialValue) {
            this.proxy = this.initialValues;
        }
    }
    setValues(values) {
        const keys = Array.from(new Set([...Object.keys(values), ...Object.keys(this.proxy)]));
        let proxyHasChanges = false;
        keys.forEach(field => {
            if (!this.registry.hasNested(field)) {
                return;
            }
            this.registry.getNested(field).forEach((registryField, registryKey) => {
                const $input = this.registry.get(registryKey);
                const oldValue = getNested(this.proxy, registryKey);
                const newValue = getNested(values, registryKey);
                if (!shallowEqualObjects(newValue, oldValue)) {
                    this.setFieldValue(registryKey, newValue);
                    proxyHasChanges = true;
                }
                if (!shallowEqualObjects(newValue, $input.proxy)) {
                    $input.context.model = newValue;
                }
            });
        });
        this.initProxy();
        if (proxyHasChanges) {
            this.$emit('input', Object.assign({}, this.proxy));
        }
    }
    setFieldValue(field, value) {
        if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _a = this.proxy, _b = field, value = _a[_b], proxy = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            this.proxy = proxy;
        }
        else {
            setNested(this.proxy, field, value);
        }
    }
    setFieldValueAndEmit(field, value) {
        this.setFieldValue(field, value);
        this.$emit('input', Object.assign({}, this.proxy));
    }
    setErrors({ formErrors, inputErrors }) {
        this.localFormErrors = formErrors || [];
        this.localFieldErrors = inputErrors || {};
    }
    hasValidationErrors() {
        return Promise.all(this.registry.reduce((resolvers, input) => {
            resolvers.push(input.runValidation() && input.hasValidationErrors());
            return resolvers;
        }, [])).then(results => results.some(hasErrors => hasErrors));
    }
    resetValidation() {
        this.localFormErrors = [];
        this.localFieldErrors = {};
        this.registry.forEach((input) => {
            input.resetValidation();
        });
    }
};
__decorate([
    Model('input', { default: () => ({}) })
], FormularioForm.prototype, "formularioValue", void 0);
__decorate([
    Prop({ default: () => ({}) })
], FormularioForm.prototype, "errors", void 0);
__decorate([
    Prop({ default: () => ([]) })
], FormularioForm.prototype, "formErrors", void 0);
__decorate([
    Provide()
], FormularioForm.prototype, "path", void 0);
__decorate([
    Watch('formularioValue', { deep: true })
], FormularioForm.prototype, "onFormularioValueChanged", null);
__decorate([
    Watch('mergedFormErrors')
], FormularioForm.prototype, "onMergedFormErrorsChanged", null);
__decorate([
    Watch('mergedFieldErrors', { deep: true, immediate: true })
], FormularioForm.prototype, "onMergedFieldErrorsChanged", null);
__decorate([
    Provide()
], FormularioForm.prototype, "getFormValues", null);
__decorate([
    Provide()
], FormularioForm.prototype, "onFormularioFieldValidation", null);
__decorate([
    Provide()
], FormularioForm.prototype, "addErrorObserver", null);
__decorate([
    Provide()
], FormularioForm.prototype, "removeErrorObserver", null);
__decorate([
    Provide('formularioRegister')
], FormularioForm.prototype, "register", null);
__decorate([
    Provide('formularioDeregister')
], FormularioForm.prototype, "deregister", null);
__decorate([
    Provide('formularioSetter')
], FormularioForm.prototype, "setFieldValueAndEmit", null);
FormularioForm = __decorate([
    Component({ name: 'FormularioForm' })
], FormularioForm);
var script = FormularioForm;

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "form",
    {
      on: {
        submit: function($event) {
          $event.preventDefault();
          return _vm.onFormSubmit($event)
        }
      }
    },
    [_vm._t("default", null, { errors: _vm.mergedFormErrors })],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );

let FormularioGrouping = class FormularioGrouping extends Vue {
    get groupPath() {
        if (this.isArrayItem) {
            return `${this.path}[${this.name}]`;
        }
        if (this.path === '') {
            return this.name;
        }
        return `${this.path}.${this.name}`;
    }
};
__decorate([
    Inject({ default: '' })
], FormularioGrouping.prototype, "path", void 0);
__decorate([
    Prop({ required: true })
], FormularioGrouping.prototype, "name", void 0);
__decorate([
    Prop({ default: false })
], FormularioGrouping.prototype, "isArrayItem", void 0);
__decorate([
    Provide('path')
], FormularioGrouping.prototype, "groupPath", null);
FormularioGrouping = __decorate([
    Component({ name: 'FormularioGrouping' })
], FormularioGrouping);
var script$1 = FormularioGrouping;

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [_vm._t("default")], 2)
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  const __vue_inject_styles__$1 = undefined;
  /* scoped */
  const __vue_scope_id__$1 = undefined;
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$1 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    undefined,
    undefined,
    undefined
  );

function createValidator(ruleFn, ruleName, ruleArgs, messageFn) {
    return (context) => {
        return Promise.resolve(ruleFn(context, ...ruleArgs)).then(valid => {
            return !valid ? {
                rule: ruleName,
                args: ruleArgs,
                context,
                message: messageFn(context, ...ruleArgs),
            } : null;
        });
    };
}
function parseModifier(ruleName) {
    if (/^[\^]/.test(ruleName.charAt(0))) {
        return [snakeToCamel(ruleName.substr(1)), ruleName.charAt(0)];
    }
    return [snakeToCamel(ruleName), null];
}
function processSingleArrayConstraint(constraint, rules, messages) {
    const args = constraint.slice();
    const first = args.shift();
    if (typeof first === 'function') {
        return [first, null, null];
    }
    if (typeof first !== 'string') {
        throw new Error('[Formulario]: For array constraint first element must be rule name or Validator function');
    }
    const [name, modifier] = parseModifier(first);
    if (has(rules, name)) {
        return [
            createValidator(rules[name], name, args, messages[name] || messages.default),
            name,
            modifier,
        ];
    }
    throw new Error(`[Formulario] Can't create validator for constraint: ${JSON.stringify(constraint)}`);
}
function processSingleStringConstraint(constraint, rules, messages) {
    const args = constraint.split(':');
    const [name, modifier] = parseModifier(args.shift() || '');
    if (has(rules, name)) {
        return [
            createValidator(rules[name], name, args.length ? args.join(':').split(',') : [], messages[name] || messages.default),
            name,
            modifier,
        ];
    }
    throw new Error(`[Formulario] Can't create validator for constraint: ${constraint}`);
}
function processSingleConstraint(constraint, rules, messages) {
    if (typeof constraint === 'function') {
        return [constraint, null, null];
    }
    if (Array.isArray(constraint) && constraint.length) {
        return processSingleArrayConstraint(constraint, rules, messages);
    }
    if (typeof constraint === 'string') {
        return processSingleStringConstraint(constraint, rules, messages);
    }
    return [() => Promise.resolve(null), null, null];
}
function processConstraints(constraints, rules, messages) {
    if (typeof constraints === 'string') {
        return processConstraints(constraints.split('|').filter(f => f.length), rules, messages);
    }
    if (!Array.isArray(constraints)) {
        return [];
    }
    return constraints.map(constraint => processSingleConstraint(constraint, rules, messages));
}
function enlarge(groups) {
    const enlarged = [];
    if (groups.length) {
        let current = groups.shift();
        enlarged.push(current);
        groups.forEach((group) => {
            if (!group.bail && group.bail === current.bail) {
                current.validators.push(...group.validators);
            }
            else {
                current = Object.assign({}, group);
                enlarged.push(current);
            }
        });
    }
    return enlarged;
}
/**
 * Given an array of rules, group them by bail signals. For example for this:
 * bail|required|min:10|max:20
 * we would expect:
 * [[required], [min], [max]]
 * because any sub-array failure would cause a shutdown. While
 * ^required|min:10|max:10
 * would return:
 * [[required], [min, max]]
 * and no bailing would produce:
 * [[required, min, max]]
 * @param {array} rules
 */
function createValidatorGroups(rules) {
    const mapper = ([validator, /** name */ , modifier]) => ({
        validators: [validator],
        bail: modifier === '^',
    });
    const groups = [];
    const bailIndex = rules.findIndex(([, name]) => name && name.toLowerCase() === 'bail');
    if (bailIndex >= 0) {
        groups.push(...enlarge(rules.splice(0, bailIndex + 1).slice(0, -1).map(mapper)));
        groups.push(...rules.map(([validator]) => ({
            validators: [validator],
            bail: true,
        })));
    }
    else {
        groups.push(...enlarge(rules.map(mapper)));
    }
    return groups;
}
function validateByGroup(group, context) {
    return Promise.all(group.validators.map(validate => validate(context)))
        .then(violations => violations.filter(v => v !== null));
}
function validate(validators, context) {
    return new Promise(resolve => {
        const resolveGroups = (groups, all = []) => {
            if (groups.length) {
                const current = groups.shift();
                validateByGroup(current, context).then(violations => {
                    // The rule passed or its a non-bailing group, and there are additional groups to check, continue
                    if ((violations.length === 0 || !current.bail) && groups.length) {
                        return resolveGroups(groups, all.concat(violations));
                    }
                    return resolve(all.concat(violations));
                });
            }
            else {
                resolve([]);
            }
        };
        resolveGroups(createValidatorGroups(validators));
    });
}

const VALIDATION_BEHAVIOR = {
    DEMAND: 'demand',
    LIVE: 'live',
    SUBMIT: 'submit',
};
let FormularioInput = class FormularioInput extends Vue {
    constructor() {
        super(...arguments);
        this.proxy = this.getInitialValue();
        this.localErrors = [];
        this.violations = [];
        this.validationRun = Promise.resolve();
    }
    get fullQualifiedName() {
        return this.path !== '' ? `${this.path}.${this.name}` : this.name;
    }
    get model() {
        const model = this.hasModel ? 'value' : 'proxy';
        return this.modelGetConverter(this[model]);
    }
    set model(value) {
        value = this.modelSetConverter(value, this.proxy);
        if (!shallowEqualObjects(value, this.proxy)) {
            this.proxy = value;
        }
        this.$emit('input', value);
        if (typeof this.formularioSetter === 'function') {
            this.formularioSetter(this.context.name, value);
        }
    }
    get context() {
        return Object.defineProperty({
            name: this.fullQualifiedName,
            runValidation: this.runValidation.bind(this),
            violations: this.violations,
            errors: this.localErrors,
            allErrors: [...this.localErrors, ...this.violations.map(v => v.message)],
        }, 'model', {
            get: () => this.model,
            set: (value) => {
                this.model = value;
            },
        });
    }
    get normalizedValidationRules() {
        const rules = {};
        Object.keys(this.validationRules).forEach(key => {
            rules[snakeToCamel(key)] = this.validationRules[key];
        });
        return rules;
    }
    get normalizedValidationMessages() {
        const messages = {};
        Object.keys(this.validationMessages).forEach(key => {
            messages[snakeToCamel(key)] = this.validationMessages[key];
        });
        return messages;
    }
    /**
     * Determines if this formulario element is v-modeled or not.
     */
    get hasModel() {
        return has(this.$options.propsData || {}, 'value');
    }
    onProxyChanged(newValue, oldValue) {
        if (!this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue;
        }
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation();
        }
        else {
            this.violations = [];
        }
    }
    onValueChanged(newValue, oldValue) {
        if (this.hasModel && !shallowEqualObjects(newValue, oldValue)) {
            this.context.model = newValue;
        }
    }
    created() {
        this.initProxy();
        if (typeof this.formularioRegister === 'function') {
            this.formularioRegister(this.fullQualifiedName, this);
        }
        if (typeof this.addErrorObserver === 'function' && !this.errorsDisabled) {
            this.addErrorObserver({ callback: this.setErrors, type: 'input', field: this.fullQualifiedName });
        }
        if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
            this.runValidation();
        }
    }
    // noinspection JSUnusedGlobalSymbols
    beforeDestroy() {
        if (!this.errorsDisabled && typeof this.removeErrorObserver === 'function') {
            this.removeErrorObserver(this.setErrors);
        }
        if (typeof this.formularioDeregister === 'function') {
            this.formularioDeregister(this.fullQualifiedName);
        }
    }
    getInitialValue() {
        return has(this.$options.propsData || {}, 'value') ? this.value : '';
    }
    initProxy() {
        // This should only be run immediately on created and ensures that the
        // proxy and the model are both the same before any additional registration.
        if (!shallowEqualObjects(this.context.model, this.proxy)) {
            this.context.model = this.proxy;
        }
    }
    runValidation() {
        this.validationRun = this.validate().then(violations => {
            const validationChanged = !shallowEqualObjects(violations, this.violations);
            this.violations = violations;
            if (validationChanged) {
                const payload = {
                    name: this.context.name,
                    violations: this.violations,
                };
                this.$emit('validation', payload);
                if (typeof this.onFormularioFieldValidation === 'function') {
                    this.onFormularioFieldValidation(payload);
                }
            }
            return this.violations;
        });
        return this.validationRun;
    }
    validate() {
        return validate(processConstraints(this.validation, this.$formulario.getRules(this.normalizedValidationRules), this.$formulario.getMessages(this, this.normalizedValidationMessages)), {
            value: this.context.model,
            name: this.context.name,
            formValues: this.getFormValues(),
        });
    }
    hasValidationErrors() {
        return new Promise(resolve => {
            this.$nextTick(() => {
                this.validationRun.then(() => resolve(this.violations.length > 0));
            });
        });
    }
    setErrors(errors) {
        this.localErrors = arrayify(errors);
    }
    resetValidation() {
        this.localErrors = [];
        this.violations = [];
    }
};
__decorate([
    Inject({ default: undefined })
], FormularioInput.prototype, "formularioSetter", void 0);
__decorate([
    Inject({ default: () => () => { } })
], FormularioInput.prototype, "onFormularioFieldValidation", void 0);
__decorate([
    Inject({ default: undefined })
], FormularioInput.prototype, "formularioRegister", void 0);
__decorate([
    Inject({ default: undefined })
], FormularioInput.prototype, "formularioDeregister", void 0);
__decorate([
    Inject({ default: () => () => ({}) })
], FormularioInput.prototype, "getFormValues", void 0);
__decorate([
    Inject({ default: undefined })
], FormularioInput.prototype, "addErrorObserver", void 0);
__decorate([
    Inject({ default: undefined })
], FormularioInput.prototype, "removeErrorObserver", void 0);
__decorate([
    Inject({ default: '' })
], FormularioInput.prototype, "path", void 0);
__decorate([
    Model('input', { default: '' })
], FormularioInput.prototype, "value", void 0);
__decorate([
    Prop({
        required: true,
        validator: (name) => typeof name === 'string' && name.length > 0,
    })
], FormularioInput.prototype, "name", void 0);
__decorate([
    Prop({ default: '' })
], FormularioInput.prototype, "validation", void 0);
__decorate([
    Prop({ default: () => ({}) })
], FormularioInput.prototype, "validationRules", void 0);
__decorate([
    Prop({ default: () => ({}) })
], FormularioInput.prototype, "validationMessages", void 0);
__decorate([
    Prop({
        default: VALIDATION_BEHAVIOR.DEMAND,
        validator: behavior => Object.values(VALIDATION_BEHAVIOR).includes(behavior)
    })
], FormularioInput.prototype, "validationBehavior", void 0);
__decorate([
    Prop({ default: false })
], FormularioInput.prototype, "errorsDisabled", void 0);
__decorate([
    Prop({ default: () => (value) => value })
], FormularioInput.prototype, "modelGetConverter", void 0);
__decorate([
    Prop({ default: () => (value) => value })
], FormularioInput.prototype, "modelSetConverter", void 0);
__decorate([
    Watch('proxy')
], FormularioInput.prototype, "onProxyChanged", null);
__decorate([
    Watch('value')
], FormularioInput.prototype, "onValueChanged", null);
FormularioInput = __decorate([
    Component({ name: 'FormularioInput', inheritAttrs: false })
], FormularioInput);
var script$2 = FormularioInput;

/* script */
const __vue_script__$2 = script$2;

/* template */
var __vue_render__$2 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "formulario-input" },
    [_vm._t("default", null, { context: _vm.context })],
    2
  )
};
var __vue_staticRenderFns__$2 = [];
__vue_render__$2._withStripped = true;

  /* style */
  const __vue_inject_styles__$2 = undefined;
  /* scoped */
  const __vue_scope_id__$2 = undefined;
  /* module identifier */
  const __vue_module_identifier__$2 = undefined;
  /* functional template */
  const __vue_is_functional_template__$2 = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$2 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    false,
    undefined,
    undefined,
    undefined
  );

var index = {
    install(Vue, options) {
        Vue.component('FormularioForm', __vue_component__);
        Vue.component('FormularioGrouping', __vue_component__$1);
        Vue.component('FormularioInput', __vue_component__$2);
        Vue.mixin({
            beforeCreate() {
                const o = this.$options;
                if (typeof o.formulario === 'function') {
                    this.$formulario = o.formulario();
                }
                else if (o.parent && o.parent.$formulario) {
                    this.$formulario = o.parent.$formulario;
                }
                else {
                    this.$formulario = new Formulario(options);
                }
            }
        });
    },
};

export default index;
