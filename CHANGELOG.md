# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.7.0](https://github.com/retailcrm/vue-formulario/compare/v0.6.3...v0.7.0) (2021-09-30)


### ⚠ BREAKING CHANGES

* Added property "unregisterBehavior" to FormularioField to control value unset behavior on field component removal

### Features

* Added property "unregisterBehavior" to FormularioField to control value unset behavior on field component removal ([d39ca17](https://github.com/retailcrm/vue-formulario/commit/d39ca17e45cb5957bd9b9916b6e904993e660bc5))

### [0.6.3](https://github.com/retailcrm/vue-formulario/compare/v0.6.2...v0.6.3) (2021-09-29)


### Features

* Possibility to change html tag used by FormularioField ([c7d3e83](https://github.com/retailcrm/vue-formulario/commit/c7d3e833a4f27869d12e7f66acb503eb48cbd14b))

### [0.6.2](https://github.com/retailcrm/vue-formulario/compare/v0.6.1...v0.6.2) (2021-09-21)


### Fixes

* Fixed records & arrays detection ([1d785ec](https://github.com/retailcrm/vue-formulario/commit/1d785ec5eb74be001e0903b0f8c31aa87a20ef9b))

### [0.6.1](https://github.com/retailcrm/vue-formulario/compare/v0.6.0...v0.6.1) (2021-08-03)


### Fixes

* Build ([d3beab3](https://github.com/retailcrm/vue-formulario/commit/d3beab358387e5aaa99a957af9afdee158ccd30f))

## [0.6.0](https://github.com/retailcrm/vue-formulario/compare/v0.5.1...v0.6.0) (2021-08-03)


### ⚠ BREAKING CHANGES

* Validation event payload property "name" renamed to "path"
* FormularioFieldGroup - isArrayItem prop no longer required, replaced with integer name value detection
* FormularioField - individual field errors are always presumed as a string array
* FormularioForm - renamed prop errors to fieldsErrors, some internal renamings; tests semantic improvements
* FormularioForm - renamed formularioValue into state
* FormularioField - removed formulario-input class from root element

### Features

* Added possibility to run / reset form validation via $formulario ([fd780cd](https://github.com/retailcrm/vue-formulario/commit/fd780cd585d55d2f4cc0aac9c24ed515f0cf8c57))
* FormularioField - individual field errors are always presumed as a string array ([9a344bf](https://github.com/retailcrm/vue-formulario/commit/9a344bf8b52f1889fcc93a253b08de5c360e5873))
* FormularioForm - added ::runValidation() method to run entire form validation manually and return all form violations ([aee0dc9](https://github.com/retailcrm/vue-formulario/commit/aee0dc977a538e6279ce0006ae675182f44f1333))
* Renamed FormularioInput => FormularioField, FormularioGrouping => FormularioFieldGroup, old names are preserved in plugin install method for compatibility ([013931f](https://github.com/retailcrm/vue-formulario/commit/013931fbfc1d0a5d0a8b27c7a2b9555a039bd142))
* Validation event payload property "name" renamed to "path" ([7c2a9e8](https://github.com/retailcrm/vue-formulario/commit/7c2a9e8110b443f0f2108d963dcd510e0ff2feb5))


* FormularioField - removed formulario-input class from root element ([735fa3f](https://github.com/retailcrm/vue-formulario/commit/735fa3f126b7b9f8f485b5928f396f2d787ace18))
* FormularioFieldGroup - isArrayItem prop no longer required, replaced with integer name value detection ([6612d8a](https://github.com/retailcrm/vue-formulario/commit/6612d8a5f930b535241cd0d27e2bfe7742f71627))
* FormularioForm - renamed formularioValue into state ([8144c27](https://github.com/retailcrm/vue-formulario/commit/8144c27c692fce3e685086180cffa52a3f78a25b))
* FormularioForm - renamed prop errors to fieldsErrors, some internal renamings; tests semantic improvements ([4e05844](https://github.com/retailcrm/vue-formulario/commit/4e05844e7325323d7c2054d362a5c1ae2cca8e13))


### Fixes

* Got rid of redundant input events ([b4ab340](https://github.com/retailcrm/vue-formulario/commit/b4ab3404a4ea078f0e2834a07afa93aa57bc025d))
* Url validator now allows empty value ([1023ae2](https://github.com/retailcrm/vue-formulario/commit/1023ae2fc17b4a170d1ba444f1222fd0563b5caa))
