## What is Vue Formulario?

Vue Formulario is a library, inspired by <a href="https://vueformulate.com">Vue Formulate</a>, that handles the core logic
for working with forms and gives full control on the form presentation.

## Examples

Every form control have to rendered inside FormularioField component. This component provides `id` and `context` in
v-slot props. Control should use `context.model` as v-model and `context.runValidation` as handler for `blur` event
(it is necessary for validation when property `validationBehavior` is `demand`). Errors list for a field can be
accessed through `context.allErrors`.

The example below creates the authorization form from data:
```json
{
    "username": "",
    "password": "",
    "options": {
        "anonymous": false,
        "tags": ["test"]
    }
}
```

```html
<FormularioForm
    v-model="formData"
    name="formName"
>
    <FormularioField
        v-slot="{ context }"
        name="username"
        validation="required|email"
        validation-behavior="live"
    >
        <input
            v-model="context.model"
            type="text"
            @blur="context.runValidation"
        >
        <div v-if="context.allErrors.length > 0">
            <span
                v-for="(error, index) in context.allErrors"
                :key="index"
            >
                {{ error }}
            </span>
        </div>
    </FormularioField>

    <FormularioField
        v-slot="{ context }"
        name="password"
        validation="required|min:4,length"
    >
        <input
            v-model="context.model"
            type="password"
        >
    </FormularioField>

    <FormularioFieldGroup name="options">
        <FormularioField
            v-slot="{ context }"
            name="anonymous"
        >
            <div>
                <input
                    id="options-anonymous"
                    v-model="context.model"
                    type="checkbox"
                >
                <label for="options-anonymous">As anonymous</label>
            </div>
        </FormularioField>
    </FormularioFieldGroup>

    <FormularioField
        v-slot="{ context }"
        name="options.tags[0]"
    >
        <input
            v-model="context.model"
            type="text"
        >
    </FormularioField>
</FormularioForm>
```

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2020-present, [RetailDriver LLC](https://www.retailcrm.pro) <br>
Copyright (c) 2020-present, [Braid LLC](https://www.wearebraid.com/)
