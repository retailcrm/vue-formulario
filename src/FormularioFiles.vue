<template>
    <ul
        v-if="fileUploads.length"
        class="formulario-files"
    >
        <li
            v-for="file in fileUploads"
            :key="file.uuid"
            :data-has-error="!!file.error"
            :data-has-preview="!!(imagePreview && file.previewData)"
        >
            <div class="formulario-file">
                <div
                    v-if="!!(imagePreview && file.previewData)"
                    class="formulario-file-image-preview"
                >
                    <img
                        :src="file.previewData"
                        alt=""
                    >
                </div>

                <div
                    class="formulario-file-name"
                    :title="file.name"
                    v-text="file.name"
                />

                <div
                    v-if="file.progress !== false"
                    :data-just-finished="file.justFinished"
                    :data-is-finished="!file.justFinished && file.complete"
                    class="formulario-file-progress"
                >
                    <div
                        class="formulario-file-progress-inner"
                        :style="{width: file.progress + '%'}"
                    />
                </div>

                <div
                    v-if="(file.complete && !file.justFinished) || file.progress === false"
                    class="formulario-file-remove"
                    @click="file.removeFile"
                />
            </div>

            <div
                v-if="file.error"
                class="formulario-file-upload-error"
                v-text="file.error"
            />
        </li>
    </ul>
</template>

<script>
import FileUpload from './FileUpload'

export default {
    name: 'FormularioFiles',

    props: {
        files: {
            type: FileUpload,
            required: true
        },

        imagePreview: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        fileUploads () {
            return this.files.files || []
        }
    },

    watch: {
        files () {
            if (this.imagePreview) {
                this.files.loadPreviews()
            }
        }
    },

    mounted () {
        if (this.imagePreview) {
            this.files.loadPreviews()
        }
    }
}
</script>
