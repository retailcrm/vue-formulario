import { shallowEqualObjects, has, getNested } from '@/utils'
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
     * Fully register a component.
     * @param {string} field name of the field.
     * @param {FormularioForm} component the actual component instance.
     */
    add (field: string, component: FormularioInput): void {
        if (this.registry.has(field)) {
            return
        }

        this.registry.set(field, component)

        // @ts-ignore
        const value = getNested(this.ctx.initialValues, field)
        const hasModel = has(component.$options.propsData || {}, 'value')

        // @ts-ignore
        if (!hasModel && this.ctx.hasInitialValue && value !== undefined) {
            // In the case that the form is carrying an initial value and the
            // element is not, set it directly.
            // @ts-ignore
            component.context.model = value
            // @ts-ignore
        } else if (hasModel && !shallowEqualObjects(component.proxy, value)) {
            // In this case, the field is v-modeled or has an initial value and the
            // form has no value or a different value, so use the field value
            // @ts-ignore
            this.ctx.setFieldValueAndEmit(field, component.proxy)
        }
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
            const objectKey = key + '.'
            const arrayKey = key + '['

            if (
                i === key ||
                i.substring(0, objectKey.length) === objectKey ||
                i.substring(0, arrayKey.length) === arrayKey
            ) {
                result.set(i, this.registry.get(i))
            }
        }

        return result
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
