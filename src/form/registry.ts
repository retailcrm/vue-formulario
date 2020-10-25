import { shallowEqualObjects, has, getNested } from '@/libs/utils'
import FormularioForm from '@/FormularioForm.vue'
import FormularioInput from '@/FormularioInput.vue'

/**
 * Component registry with inherent depth to handle complex nesting. This is
 * important for features such as grouped fields.
 */
export default class Registry {
    private ctx: FormularioForm
    private registry: Map<string, FormularioInput>

    /**
     * Create a new registry of components.
     * @param {FormularioForm} ctx The host vm context of the registry.
     */
    constructor (ctx: FormularioForm) {
        this.registry = new Map()
        this.ctx = ctx
    }

    /**
     * Add an item to the registry.
     */
    add (name: string, component: FormularioInput): void {
        this.registry.set(name, component)
    }

    /**
     * Remove an item from the registry.
     */
    remove (name: string): void {
        this.registry.delete(name)
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: value, ...newProxy } = this.ctx.proxy
        // @ts-ignore
        this.ctx.proxy = newProxy
    }

    /**
     * Check if the registry has the given key.
     */
    has (key: string): boolean {
        return this.registry.has(key)
    }

    /**
     * Check if the registry has elements, that equals or nested given key
     */
    hasNested (key: string): boolean {
        for (const i of this.registry.keys()) {
            if (i === key || i.includes(key + '.')) {
                return true
            }
        }

        return false
    }

    /**
     * Get a particular registry value.
     */
    get (key: string): FormularioInput | undefined {
        return this.registry.get(key)
    }

    /**
     * Get registry value for key or nested to given key
     */
    getNested (key: string): Map<string, FormularioInput> {
        const result = new Map()

        for (const i of this.registry.keys()) {
            if (i === key || i.includes(key + '.')) {
                result.set(i, this.registry.get(i))
            }
        }

        return result
    }

    /**
     * Map over the registry (recursively).
     */
    map (mapper: Function): Record<string, any> {
        const value = {}
        this.registry.forEach((component, field) => Object.assign(value, { [field]: mapper(component, field) }))
        return value
    }

    /**
     * Map over the registry (recursively).
     */
    forEach (callback: Function): void {
        this.registry.forEach((component, field) => {
            callback(component, field)
        })
    }

    /**
     * Return the keys of the registry.
     */
    keys (): string[] {
        return Array.from(this.registry.keys())
    }

    /**
     * Fully register a component.
     * @param {string} field name of the field.
     * @param {FormularioForm} component the actual component instance.
     */
    register (field: string, component: FormularioInput): void {
        if (this.registry.has(field)) {
            return
        }
        this.registry.set(field, component)
        const hasModel = has(component.$options.propsData || {}, 'value')
        if (
            !hasModel &&
            // @ts-ignore
            this.ctx.hasInitialValue &&
            // @ts-ignore
            getNested(this.ctx.initialValues, field) !== undefined
        ) {
            // In the case that the form is carrying an initial value and the
            // element is not, set it directly.
            // @ts-ignore
            component.context.model = getNested(this.ctx.initialValues, field)
        } else if (
            hasModel &&
            // @ts-ignore
            !shallowEqualObjects(component.proxy, getNested(this.ctx.initialValues, field))
        ) {
            // In this case, the field is v-modeled or has an initial value and the
            // form has no value or a different value, so use the field value
            // @ts-ignore
            this.ctx.setFieldValue(field, component.proxy)
        }
        // @ts-ignore
        if (this.ctx.childrenShouldShowErrors) {
            // @ts-ignore
            component.formShouldShowErrors = true
        }
    }

    /**
     * Reduce the registry.
     * @param {function} callback
     * @param accumulator
     */
    reduce<U> (callback: Function, accumulator: U): U {
        this.registry.forEach((component, field) => {
            accumulator = callback(accumulator, component, field)
        })
        return accumulator
    }
}
