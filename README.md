## What is Vue Formulario?

Vue Formulario is a library, based on <a href="https://vueformulate.com">Vue Formulate</a>, that handles the core logic for working with forms and gives full control on the form presentation.

## Examples

Every form control have to rendered inside FormularioInput component. This component provides `id` and `context` in v-slot props. Control should use `context.model` as v-model and `context.blurHandler` as handler for `blur` event (it is necessary for validation when property `errorBehavior` is `blur`). Errors list for field can be accessed through `context.allErrors`.

The example below creates the authorization form from data:
```json
    {
        "username": "",
        "password": "",
        "options": {
            "anonym": false,
            "tags": ["test"]
        },
    }
```

```html
    <FormularioForm
        v-model="formData"
        name="formName"
    >
        <FormularioInput
            v-slot="vSlot"
            name="username"
            validation="required|email"
            error-behavior="live"
        >
            <input
                v-model="vSlot.context.model"
                type="text"
                @blur="vSlot.context.blurHandler"
            >
            <div v-if="vSlot.context.showValidationErrors">
                <span
                    v-for="(error, index) in vSlot.context.allErrors"
                    :key="index"
                >
                    {{ error }}
                </span>
            </div>
        </FormularioInput>

        <FormularioInput
            v-slot="vSlot"
            name="password"
            validation="required|min:4,length"
        >
            <input
                v-model="vSlot.context.model"
                type="password"
            >
        </FormularioInput>

        <FormularioGrouping name="options">
            <FormularioInput
                v-slot="vSlot"
                name="anonym"
            >
                <div>
                    <input
                        :id="vSlot.id"
                        v-model="vSlot.context.model"
                        type="checkbox"
                    >
                    <label :for="vSlot.id">As anonym</label>
                </div>
            </FormularioInput>
        </FormularioGrouping>

        <FormularioInput
            v-slot="vSlot"
            name="options.tags[0]"
        >
            <input
                v-model="vSlot.context.model"
                type="text"
            >
        </FormularioInput>
    </FormularioForm>
```

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2020-present, [RetailDriver LLC](https://www.retailcrm.pro) <br>
Copyright (c) 2020-present, [Braid LLC](https://www.wearebraid.com/)
