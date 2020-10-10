import nanoid from 'nanoid/non-secure'
import { AxiosResponse, AxiosError } from '@/axios.types'
import { ObjectType } from '@/common.types'

interface FileItem {
    uuid: string
    name: string
    path: string | false
    progress: number | false
    error: any | false
    complete: boolean
    file: File
    justFinished: boolean
    removeFile(): void
    previewData: string | false
}

interface ProgressSetter {
    (progress: number): void
}

interface ErrorHandler {
    (error: AxiosError): any
}

// noinspection JSUnusedGlobalSymbols
/**
 * The file upload class holds and represents a file’s upload state durring
 * the upload flow.
 */
class FileUpload {
    public input: DataTransfer
    public fileList: FileList
    public files: FileItem[]
    public options: ObjectType
    public context: ObjectType
    public results: any[] | boolean

    constructor (input: DataTransfer, context: ObjectType, options: ObjectType = {}) {
        this.input = input
        this.fileList = input.files
        this.files = []
        this.options = { ...{ mimes: {} }, ...options }
        this.results = false
        this.context = context
        if (Array.isArray(this.fileList)) {
            this.rehydrateFileList(this.fileList)
        } else {
            this.addFileList(this.fileList)
        }
    }

    /**
     * Given a pre-existing array of files, create a faux FileList.
     * @param {array} items expects an array of objects [{ url: '/uploads/file.pdf' }]
     */
    rehydrateFileList (items: any[]) {
        const fauxFileList = items.reduce((fileList, item) => {
            const key = this.options ? this.options.fileUrlKey : 'url'
            const url = item[key]
            const ext = (url && url.lastIndexOf('.') !== -1) ? url.substr(url.lastIndexOf('.') + 1) : false
            const mime = this.options.mimes[ext] || false
            fileList.push(Object.assign({}, item, url ? {
                name: url.substr((url.lastIndexOf('/') + 1) || 0),
                type: item.type ? item.type : mime,
                previewData: url
            } : {}))
            return fileList
        }, [])
        this.results = items
        this.addFileList(fauxFileList)
    }

    /**
     * Produce an array of files and alert the callback.
     * @param {FileList} fileList
     */
    addFileList (fileList: FileList) {
        for (let i = 0; i < fileList.length; i++) {
            const file: File = fileList[i]
            const uuid = nanoid()
            this.files.push({
                progress: false,
                error: false,
                complete: false,
                justFinished: false,
                name: file.name || 'file-upload',
                file,
                uuid,
                path: false,
                removeFile: () => this.removeFile(uuid),
                // @ts-ignore
                previewData: file.previewData || false
            })
        }
    }

    /**
     * Check if the file has an.
     */
    hasUploader () {
        return !!this.context.uploader
    }

    /**
     * Check if the given uploader is axios instance. This isn't a great way of
     * testing if it is or not, but AFIK there isn't a better way right now:
     *
     * https://github.com/axios/axios/issues/737
     */
    uploaderIsAxios () {
        return this.hasUploader &&
            typeof this.context.uploader.request === 'function' &&
            typeof this.context.uploader.get === 'function' &&
            typeof this.context.uploader.delete === 'function' &&
            typeof this.context.uploader.post === 'function'
    }

    /**
     * Get a new uploader function.
     */
    getUploader (...args: [File, ProgressSetter, ErrorHandler, ObjectType]) {
        if (this.uploaderIsAxios()) {
            const data = new FormData()
            data.append(this.context.name || 'file', args[0])
            if (this.context.uploadUrl === false) {
                throw new Error('No uploadURL specified: https://vueformulate.com/guide/inputs/file/#props')
            }
            return this.context.uploader.post(this.context.uploadUrl, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (event: ProgressEvent) => {
                    // args[1] here is the upload progress handler function
                    args[1](Math.round((event.loaded * 100) / event.total))
                }
            })
                .then((response: AxiosResponse) => response.data)
                .catch(args[2])
        }
        return this.context.uploader(...args)
    }

    /**
     * Perform the file upload.
     */
    upload () {
        if (this.results) {
            return Promise.resolve(this.results)
        }
        return new Promise((resolve, reject) => {
            if (!this.hasUploader) {
                return reject(new Error('No uploader has been defined'))
            }
            Promise.all(this.files.map(file => {
                return file.path ? Promise.resolve(file.path) : this.getUploader(
                    file.file,
                    progress => {
                        file.progress = progress
                        if (progress >= 100) {
                            if (!file.complete) {
                                file.justFinished = true
                                setTimeout(() => { file.justFinished = false }, this.options.uploadJustCompleteDuration)
                            }
                            file.complete = true
                        }
                    },
                    error => {
                        file.progress = 0
                        file.error = error
                        file.complete = true
                    },
                    this.options
                )
            }))
                .then(results => {
                    this.results = results
                    resolve(results)
                })
                .catch(err => { throw new Error(err) })
        })
    }

    /**
     * Remove a file from the uploader (and the file list)
     */
    removeFile (uuid: string) {
        this.files = this.files.filter(file => file.uuid !== uuid)
        this.context.performValidation()
        if (window && this.fileList instanceof FileList) {
            const transfer = new DataTransfer()
            this.files.map(({ file }) => transfer.items.add(file))
            this.fileList = transfer.files
            this.input = transfer
        }
    }

    /**
     * load image previews for all uploads.
     */
    loadPreviews () {
        this.files.map(file => {
            if (!file.previewData && window && window.FileReader && /^image\//.test(file.file.type)) {
                const reader = new FileReader()
                // @ts-ignore
                reader.onload = e => Object.assign(file, { previewData: e.target.result })
                reader.readAsDataURL(file.file)
            }
        })
    }

    /**
     * Get the files.
     */
    getFileList () {
        return this.fileList
    }

    /**
     * Get the files.
     */
    getFiles () {
        return this.files
    }

    toString () {
        const descriptor = this.files.length ? this.files.length + ' files' : 'empty'
        return this.results ? JSON.stringify(this.results, null, '  ') : `FileUpload(${descriptor})`
    }
}

export default FileUpload
