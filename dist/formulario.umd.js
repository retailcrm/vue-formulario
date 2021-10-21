(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('is-plain-object'), require('is-url'), require('vue'), require('vue-property-decorator')) :
    typeof define === 'function' && define.amd ? define(['is-plain-object', 'is-url', 'vue', 'vue-property-decorator'], factory) :
    (global = global || self, global.Formulario = factory(global.isPlainObject, global.isUrl, global.Vue, global.vuePropertyDecorator));
}(this, (function (isPlainObject, isUrl, Vue, vuePropertyDecorator) { 'use strict';

    isPlainObject = isPlainObject && Object.prototype.hasOwnProperty.call(isPlainObject, 'default') ? isPlainObject['default'] : isPlainObject;
    isUrl = isUrl && Object.prototype.hasOwnProperty.call(isUrl, 'default') ? isUrl['default'] : isUrl;
    Vue = Vue && Object.prototype.hasOwnProperty.call(Vue, 'default') ? Vue['default'] : Vue;

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

    const registry = new Map();
    var id = (prefix) => {
        const current = registry.get(prefix) || 0;
        const next = current + 1;
        registry.set(prefix, next);
        return `${prefix}-${next}`;
    };

    var TYPE;
    (function (TYPE) {
        TYPE["ARRAY"] = "ARRAY";
        TYPE["BIGINT"] = "BIGINT";
        TYPE["BOOLEAN"] = "BOOLEAN";
        TYPE["DATE"] = "DATE";
        TYPE["FUNCTION"] = "FUNCTION";
        TYPE["NUMBER"] = "NUMBER";
        TYPE["RECORD"] = "RECORD";
        TYPE["STRING"] = "STRING";
        TYPE["SYMBOL"] = "SYMBOL";
        TYPE["UNDEFINED"] = "UNDEFINED";
        TYPE["NULL"] = "NULL";
    })(TYPE || (TYPE = {}));
    const constructorOf = (value) => {
        return Object.getPrototypeOf(value).constructor;
    };
    function isRecord(value) {
        return constructorOf(value) === Object && Object.keys(Object.getPrototypeOf(value)).length === 0;
    }
    function isRecordLike(value) {
        return typeof value === 'object' && value !== null && (isRecord(value) || Array.isArray(value));
    }
    function typeOf(value) {
        switch (typeof value) {
            case 'bigint':
                return TYPE.BIGINT;
            case 'boolean':
                return TYPE.BOOLEAN;
            case 'function':
                return TYPE.FUNCTION;
            case 'number':
                return TYPE.NUMBER;
            case 'string':
                return TYPE.STRING;
            case 'symbol':
                return TYPE.SYMBOL;
            case 'undefined':
                return TYPE.UNDEFINED;
            case 'object':
                if (value === null) {
                    return TYPE.NULL;
                }
                if (value instanceof Date) {
                    return TYPE.DATE;
                }
                if (Array.isArray(value)) {
                    return TYPE.ARRAY;
                }
                if (isRecord(value)) {
                    return TYPE.RECORD;
                }
                return 'InstanceOf<' + constructorOf(value).name + '>';
        }
        throw new Error();
    }
    function isScalar(value) {
        switch (typeof value) {
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'string':
            case 'symbol':
            case 'undefined':
                return true;
            default:
                return value === null;
        }
    }

    const cloneInstance = (original) => {
        return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
    };
    /**
     * A simple (somewhat non-comprehensive) clone function, valid for our use
     * case of needing to unbind reactive watchers.
     */
    function clone(value) {
        // scalars & immutables
        if (isScalar(value) || value instanceof Blob) {
            return value;
        }
        if (value instanceof Date) {
            return new Date(value);
        }
        if (!isRecordLike(value)) {
            return cloneInstance(value);
        }
        if (Array.isArray(value)) {
            return value.slice().map(clone);
        }
        const source = value;
        return Object.keys(source).reduce((copy, key) => (Object.assign(Object.assign({}, copy), { [key]: clone(source[key]) })), {});
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

    const extractIntOrNaN = (value) => {
        const numeric = parseInt(value);
        return numeric.toString() === value ? numeric : NaN;
    };
    const extractPath = (raw) => {
        const path = [];
        raw.split('.').forEach(key => {
            if (/(.*)\[(\d+)]$/.test(key)) {
                path.push(...key.substr(0, key.length - 1).split('[').filter(k => k.length));
            }
            else {
                path.push(key);
            }
        });
        return path;
    };
    function get(state, rawOrPath, fallback = undefined) {
        const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath;
        if (isScalar(state) || path.length === 0) {
            return fallback;
        }
        const key = path.shift();
        const index = extractIntOrNaN(key);
        if (!isNaN(index)) {
            if (Array.isArray(state) && index >= 0 && index < state.length) {
                return path.length === 0 ? state[index] : get(state[index], path, fallback);
            }
            return undefined;
        }
        if (has(state, key)) {
            const values = state;
            return path.length === 0 ? values[key] : get(values[key], path, fallback);
        }
        return undefined;
    }
    function set(state, rawOrPath, value) {
        const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath;
        if (path.length === 0) {
            return value;
        }
        const key = path.shift();
        const index = extractIntOrNaN(key);
        if (!isRecordLike(state)) {
            return set(!isNaN(index) ? [] : {}, [key, ...path], value);
        }
        if (!isNaN(index) && Array.isArray(state)) {
            const slice = [...state];
            slice[index] = path.length === 0 ? value : set(slice[index], path, value);
            return slice;
        }
        const slice = Object.assign({}, state);
        slice[key] = path.length === 0 ? value : set(slice[key], path, value);
        return slice;
    }
    const unsetInRecord = (record, prop) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _a = record, _b = prop, _ = _a[_b], copy = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
        return copy;
    };
    function unset(state, rawOrPath) {
        if (!isRecordLike(state)) {
            return state;
        }
        const path = typeof rawOrPath === 'string' ? extractPath(rawOrPath) : rawOrPath;
        if (path.length === 0) {
            return state;
        }
        const key = path.shift();
        const index = extractIntOrNaN(key);
        if (!isNaN(index) && Array.isArray(state) && index >= 0 && index < state.length) {
            const slice = [...state];
            if (path.length === 0) {
                slice.splice(index, 1);
            }
            else {
                slice[index] = unset(slice[index], path);
            }
            return slice;
        }
        if (has(state, key)) {
            const slice = Object.assign({}, state);
            return path.length === 0
                ? unsetInRecord(slice, key)
                : Object.assign(Object.assign({}, slice), { [key]: unset(slice[key], path) });
        }
        return state;
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

    function datesEquals(a, b) {
        return a.getTime() === b.getTime();
    }
    function arraysEquals(a, b, predicate) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!predicate(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    function recordsEquals(a, b, predicate) {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        for (const prop in a) {
            if (!has(b, prop) || !predicate(a[prop], b[prop])) {
                return false;
            }
        }
        return true;
    }
    function strictEquals(a, b) {
        return a === b;
    }
    function equals(a, b, predicate) {
        const typeOfA = typeOf(a);
        const typeOfB = typeOf(b);
        return typeOfA === typeOfB && ((typeOfA === TYPE.ARRAY && arraysEquals(a, b, predicate)) ||
            (typeOfA === TYPE.DATE && datesEquals(a, b)) ||
            (typeOfA === TYPE.RECORD && recordsEquals(a, b, predicate)) ||
            (typeOfA.includes('InstanceOf') && equals(Object.entries(a), Object.entries(b), predicate)));
    }
    function deepEquals(a, b) {
        return a === b || equals(a, b, deepEquals);
    }
    function shallowEquals(a, b) {
        return a === b || equals(a, b, strictEquals);
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
            return stack.some(item => shallowEquals(item, value));
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
            return !stack.some(item => shallowEquals(item, value));
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
            if (!value) {
                return true;
            }
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
            this.registry = new Map();
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
            throw new Error(`[Formulario]: Formulario.extend(): should be passed an object (was ${typeof extendWith})`);
        }
        runValidation(id) {
            if (!this.registry.has(id)) {
                throw new Error(`[Formulario]: Formulario.runValidation(): no forms with id "${id}"`);
            }
            const form = this.registry.get(id);
            return form.runValidation();
        }
        resetValidation(id) {
            if (!this.registry.has(id)) {
                return;
            }
            const form = this.registry.get(id);
            form.resetValidation();
        }
        /**
         * Used by forms instances to add themselves into a registry
         * @internal
         */
        register(id, form) {
            if (this.registry.has(id)) {
                throw new Error(`[Formulario]: Formulario.register(): id "${id}" is already in use`);
            }
            this.registry.set(id, form);
        }
        /**
         * Used by forms instances to remove themselves from a registry
         * @internal
         */
        unregister(id) {
            if (this.registry.has(id)) {
                this.registry.delete(id);
            }
        }
        /**
         * Get validation rules by merging any passed in with global rules.
         * @internal
         */
        getRules(extendWith = {}) {
            return merge(this.validationRules, extendWith);
        }
        /**
         * Get validation messages by merging any passed in with global messages.
         * @internal
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

    const UNREGISTER_BEHAVIOR = {
        NONE: 'none',
        UNSET: 'unset',
    };

    const VALIDATION_BEHAVIOR = {
        DEMAND: 'demand',
        LIVE: 'live',
        SUBMIT: 'submit',
    };
    let FormularioField = class FormularioField extends Vue {
        constructor() {
            super(...arguments);
            this.proxy = this.hasModel ? this.value : '';
            this.localErrors = [];
            this.violations = [];
            this.validationRun = Promise.resolve([]);
        }
        get fullPath() {
            return this.__Formulario_path !== '' ? `${this.__Formulario_path}.${this.name}` : this.name;
        }
        /**
         * Determines if this formulario element is v-modeled or not.
         */
        get hasModel() {
            return has(this.$options.propsData || {}, 'value');
        }
        get context() {
            return Object.defineProperty({
                name: this.fullPath,
                path: this.fullPath,
                runValidation: this.runValidation.bind(this),
                violations: this.violations,
                errors: this.localErrors,
                allErrors: [...this.localErrors, ...this.violations.map(v => v.message)],
            }, 'model', {
                get: () => this.modelGetConverter(this.proxy),
                set: (value) => {
                    this.syncProxy(this.modelSetConverter(value, this.proxy));
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
        onValueChange() {
            this.syncProxy(this.value);
        }
        onProxyChange() {
            if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
                this.runValidation();
            }
            else {
                this.resetValidation();
            }
        }
        /**
         * @internal
         */
        created() {
            if (typeof this.__FormularioForm_register === 'function') {
                this.__FormularioForm_register(this.fullPath, this);
            }
            if (this.validationBehavior === VALIDATION_BEHAVIOR.LIVE) {
                this.runValidation();
            }
        }
        /**
         * @internal
         */
        beforeDestroy() {
            if (typeof this.__FormularioForm_unregister === 'function') {
                this.__FormularioForm_unregister(this.fullPath, this.unregisterBehavior);
            }
        }
        syncProxy(value) {
            if (!deepEquals(value, this.proxy)) {
                this.proxy = value;
                this.$emit('input', value);
                if (typeof this.__FormularioForm_set === 'function') {
                    this.__FormularioForm_set(this.fullPath, value);
                    this.__FormularioForm_emitInput();
                }
            }
        }
        runValidation() {
            this.validationRun = this.validate().then(violations => {
                this.violations = violations;
                this.emitValidation(this.fullPath, violations);
                return this.violations;
            });
            return this.validationRun;
        }
        validate() {
            return validate(processConstraints(this.validation, this.$formulario.getRules(this.normalizedValidationRules), this.$formulario.getMessages(this, this.normalizedValidationMessages)), {
                value: this.proxy,
                name: this.fullPath,
                formValues: this.__FormularioForm_getState(),
            });
        }
        emitValidation(path, violations) {
            this.$emit('validation', { path, violations });
            if (typeof this.__FormularioForm_emitValidation === 'function') {
                this.__FormularioForm_emitValidation(path, violations);
            }
        }
        hasValidationErrors() {
            return new Promise(resolve => {
                this.$nextTick(() => {
                    this.validationRun.then(() => resolve(this.violations.length > 0));
                });
            });
        }
        /**
         * @internal
         */
        setErrors(errors) {
            if (!this.errorsDisabled) {
                this.localErrors = errors;
            }
        }
        /**
         * @internal
         */
        resetValidation() {
            this.localErrors = [];
            this.violations = [];
        }
    };
    __decorate([
        vuePropertyDecorator.Inject({ default: '' })
    ], FormularioField.prototype, "__Formulario_path", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: undefined })
    ], FormularioField.prototype, "__FormularioForm_set", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: () => () => { } })
    ], FormularioField.prototype, "__FormularioForm_emitInput", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: () => () => { } })
    ], FormularioField.prototype, "__FormularioForm_emitValidation", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: undefined })
    ], FormularioField.prototype, "__FormularioForm_register", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: undefined })
    ], FormularioField.prototype, "__FormularioForm_unregister", void 0);
    __decorate([
        vuePropertyDecorator.Inject({ default: () => () => ({}) })
    ], FormularioField.prototype, "__FormularioForm_getState", void 0);
    __decorate([
        vuePropertyDecorator.Model('input', { default: '' })
    ], FormularioField.prototype, "value", void 0);
    __decorate([
        vuePropertyDecorator.Prop({
            required: true,
            validator: (name) => typeof name === 'string' && name.length > 0,
        })
    ], FormularioField.prototype, "name", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: '' })
    ], FormularioField.prototype, "validation", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => ({}) })
    ], FormularioField.prototype, "validationRules", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => ({}) })
    ], FormularioField.prototype, "validationMessages", void 0);
    __decorate([
        vuePropertyDecorator.Prop({
            default: VALIDATION_BEHAVIOR.DEMAND,
            validator: behavior => Object.values(VALIDATION_BEHAVIOR).includes(behavior)
        })
    ], FormularioField.prototype, "validationBehavior", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: false })
    ], FormularioField.prototype, "errorsDisabled", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => (value) => value })
    ], FormularioField.prototype, "modelGetConverter", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => (value) => value })
    ], FormularioField.prototype, "modelSetConverter", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: 'div' })
    ], FormularioField.prototype, "tag", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: UNREGISTER_BEHAVIOR.NONE })
    ], FormularioField.prototype, "unregisterBehavior", void 0);
    __decorate([
        vuePropertyDecorator.Watch('value')
    ], FormularioField.prototype, "onValueChange", null);
    __decorate([
        vuePropertyDecorator.Watch('proxy')
    ], FormularioField.prototype, "onProxyChange", null);
    FormularioField = __decorate([
        vuePropertyDecorator.Component({ name: 'FormularioField', inheritAttrs: false })
    ], FormularioField);
    var script = FormularioField;

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
        _vm.tag,
        _vm._b({ tag: "component" }, "component", _vm.$attrs, false),
        [_vm._t("default", null, { context: _vm.context })],
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

    let FormularioFieldGroup = class FormularioFieldGroup extends Vue {
        get fullPath() {
            const path = `${this.name}`;
            if (parseInt(path).toString() === path) {
                return `${this.__Formulario_path}[${path}]`;
            }
            if (this.__Formulario_path === '') {
                return path;
            }
            return `${this.__Formulario_path}.${path}`;
        }
    };
    __decorate([
        vuePropertyDecorator.Inject({ default: '' })
    ], FormularioFieldGroup.prototype, "__Formulario_path", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ required: true })
    ], FormularioFieldGroup.prototype, "name", void 0);
    __decorate([
        vuePropertyDecorator.Provide('__Formulario_path')
    ], FormularioFieldGroup.prototype, "fullPath", null);
    FormularioFieldGroup = __decorate([
        vuePropertyDecorator.Component({ name: 'FormularioFieldGroup' })
    ], FormularioFieldGroup);
    var script$1 = FormularioFieldGroup;

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

    const update = (state, path, value) => {
        if (value === undefined) {
            return unset(state, path);
        }
        return set(state, path, value);
    };
    let FormularioForm = class FormularioForm extends Vue {
        constructor() {
            super(...arguments);
            this.proxy = {};
            this.registry = new Map();
            // Local error messages are temporal, they wiped each resetValidation call
            this.localFieldsErrors = {};
            this.localFormErrors = [];
        }
        get fieldsErrorsComputed() {
            return merge(this.fieldsErrors || {}, this.localFieldsErrors);
        }
        get formErrorsComputed() {
            return [...this.formErrors, ...this.localFormErrors];
        }
        register(path, field) {
            if (!this.registry.has(path)) {
                this.registry.set(path, field);
            }
            const value = get(this.proxy, path);
            if (!field.hasModel) {
                if (value !== undefined) {
                    field.proxy = value;
                }
                else {
                    this.setFieldValue(path, null);
                    this.emitInput();
                }
            }
            else if (!deepEquals(field.proxy, value)) {
                this.setFieldValue(path, field.proxy);
                this.emitInput();
            }
            if (has(this.fieldsErrorsComputed, path)) {
                field.setErrors(this.fieldsErrorsComputed[path]);
            }
        }
        unregister(path, behavior) {
            if (this.registry.has(path)) {
                this.registry.delete(path);
                if (behavior === UNREGISTER_BEHAVIOR.UNSET) {
                    this.proxy = unset(this.proxy, path);
                    this.emitInput();
                }
            }
        }
        getState() {
            return this.proxy;
        }
        setFieldValue(path, value) {
            this.proxy = update(this.proxy, path, value);
        }
        emitInput() {
            this.$emit('input', clone(this.proxy));
        }
        emitValidation(path, violations) {
            this.$emit('validation', { path, violations });
        }
        onStateChange(newState) {
            const newProxy = clone(newState);
            const oldProxy = this.proxy;
            let proxyHasChanges = false;
            this.registry.forEach((field, path) => {
                const newValue = get(newState, path, null);
                const oldValue = get(oldProxy, path, null);
                field.proxy = newValue;
                if (!deepEquals(newValue, oldValue)) {
                    field.$emit('input', newValue);
                    update(newProxy, path, newValue);
                    proxyHasChanges = true;
                }
            });
            this.proxy = newProxy;
            if (proxyHasChanges) {
                this.emitInput();
            }
        }
        onFieldsErrorsChange(fieldsErrors) {
            this.registry.forEach((field, path) => {
                field.setErrors(fieldsErrors[path] || []);
            });
        }
        created() {
            this.$formulario.register(this.id, this);
            if (typeof this.state === 'object') {
                this.proxy = clone(this.state);
            }
        }
        beforeDestroy() {
            this.$formulario.unregister(this.id);
        }
        runValidation() {
            const runs = [];
            const violations = {};
            this.registry.forEach((field, path) => {
                runs.push(field.runValidation().then(v => { violations[path] = v; }));
            });
            return Promise.all(runs).then(() => violations);
        }
        hasValidationErrors() {
            return this.runValidation().then(violations => {
                return Object.keys(violations).some(path => violations[path].length > 0);
            });
        }
        setErrors({ fieldsErrors, formErrors }) {
            this.localFieldsErrors = fieldsErrors || {};
            this.localFormErrors = formErrors || [];
        }
        resetValidation() {
            this.localFieldsErrors = {};
            this.localFormErrors = [];
            this.registry.forEach((field) => {
                field.resetValidation();
            });
        }
        onSubmit() {
            return this.runValidation().then(violations => {
                const hasErrors = Object.keys(violations).some(path => violations[path].length > 0);
                if (!hasErrors) {
                    this.$emit('submit', clone(this.proxy));
                }
                else {
                    this.$emit('error', violations);
                }
            });
        }
    };
    __decorate([
        vuePropertyDecorator.Model('input', { default: () => ({}) })
    ], FormularioForm.prototype, "state", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => id('formulario-form') })
    ], FormularioForm.prototype, "id", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => ({}) })
    ], FormularioForm.prototype, "fieldsErrors", void 0);
    __decorate([
        vuePropertyDecorator.Prop({ default: () => ([]) })
    ], FormularioForm.prototype, "formErrors", void 0);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_register')
    ], FormularioForm.prototype, "register", null);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_unregister')
    ], FormularioForm.prototype, "unregister", null);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_getState')
    ], FormularioForm.prototype, "getState", null);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_set')
    ], FormularioForm.prototype, "setFieldValue", null);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_emitInput')
    ], FormularioForm.prototype, "emitInput", null);
    __decorate([
        vuePropertyDecorator.Provide('__FormularioForm_emitValidation')
    ], FormularioForm.prototype, "emitValidation", null);
    __decorate([
        vuePropertyDecorator.Watch('state', { deep: true })
    ], FormularioForm.prototype, "onStateChange", null);
    __decorate([
        vuePropertyDecorator.Watch('fieldsErrorsComputed', { deep: true, immediate: true })
    ], FormularioForm.prototype, "onFieldsErrorsChange", null);
    FormularioForm = __decorate([
        vuePropertyDecorator.Component({ name: 'FormularioForm' })
    ], FormularioForm);
    var script$2 = FormularioForm;

    /* script */
    const __vue_script__$2 = script$2;

    /* template */
    var __vue_render__$2 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "form",
        {
          on: {
            submit: function($event) {
              $event.preventDefault();
              return _vm.onSubmit($event)
            }
          }
        },
        [_vm._t("default", null, { errors: _vm.formErrorsComputed })],
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
        Formulario,
        install(Vue, options) {
            Vue.component('FormularioField', __vue_component__);
            Vue.component('FormularioFieldGroup', __vue_component__$1);
            Vue.component('FormularioForm', __vue_component__$2);
            // @deprecated Use FormularioField instead
            Vue.component('FormularioInput', __vue_component__);
            // @deprecated Use FormularioFieldGroup instead
            Vue.component('FormularioGrouping', __vue_component__$1);
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

    return index;

})));
