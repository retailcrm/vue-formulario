import { cloneDeep } from './libs/utils'
import FileUpload from './FileUpload'
import FormularioForm from '@/FormularioForm.vue'

export default class FormSubmission {
    public form: FormularioForm

    /**
     * Initialize a formulario form.
     * @param {vm} form an instance of FormularioForm
     */
    constructor (form: FormularioForm) {
        this.form = form
    }

    /**
     * Determine if the form has any validation errors.
     */
    hasValidationErrors (): Promise<boolean> {
        return (this.form as any).hasValidationErrors()
    }

    /**
     * Asynchronously generate the values payload of this form.
     */
    values (): Promise<Record<string, any>> {
        return new Promise((resolve, reject) => {
            const form = this.form as any
            const pending = []
            const values = cloneDeep(form.proxy)

            for (const key in values) {
                if (
                    Object.prototype.hasOwnProperty.call(values, key) &&
                    typeof form.proxy[key] === 'object' &&
                    form.proxy[key] instanceof FileUpload
                ) {
                    pending.push(
                        form.proxy[key].upload().then((data: Record<string, any>) => Object.assign(values, { [key]: data }))
                    )
                }
            }
            Promise.all(pending)
                .then(() => resolve(values))
                .catch(err => reject(err))
        })
    }
}
