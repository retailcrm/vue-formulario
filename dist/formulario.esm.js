import e from"is-plain-object";import t from"is-url";import r from"vue";import{Model as i,Prop as o,Provide as s,Watch as a,Component as n,Inject as l}from"vue-property-decorator";function u(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function d(t,r,i=!0){const o={};for(const s in t)u(r,s)?e(r[s])&&e(t[s])?o[s]=d(t[s],r[s],i):i&&Array.isArray(t[s])&&Array.isArray(r[s])?o[s]=t[s].concat(r[s]):o[s]=r[s]:o[s]=t[s];for(const e in r)u(o,e)||(o[e]=r[e]);return o}function h(e){switch(typeof e){case"symbol":case"number":case"string":case"boolean":case"undefined":return!0;default:return null===e}}function c(e,t){if(e===t)return!0;if(!e||!t)return!1;const r=Object.keys(e);if(Object.keys(t).length!==r.length)return!1;if(e instanceof Date&&t instanceof Date)return e.getTime()===t.getTime();if(0===r.length)return e===t;for(let i=0;i<r.length;i++){const o=r[i];if(e[o]!==t[o])return!1}return!0}function f(e){return e.replace(/([_][a-z0-9])/gi,t=>0!==e.indexOf(t)&&"_"!==e[e.indexOf(t)-1]?t.toUpperCase().replace("_",""):t)}function p(e,t){const r=t.split(".");let i=e;for(const e in r){const t=r[e].match(/(.+)\[(\d+)\]$/);if(void 0===i)return null;if(t){if(i=i[t[1]],void 0===i)return null;i=i[t[2]]}else i=i[r[e]]}return i}var v={accepted:({value:e})=>Promise.resolve(["yes","on","1",1,!0,"true"].includes(e)),after({value:e},t=!1){const r=!1!==t?Date.parse(t):Date.now(),i=e instanceof Date?e.getTime():Date.parse(e);return Promise.resolve(!isNaN(i)&&i>r)},alpha({value:e},t="default"){const r={default:/^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/,latin:/^[a-zA-Z]+$/},i=u(r,t)?t:"default";return Promise.resolve(r[i].test(e))},alphanumeric({value:e},t="default"){const r={default:/^[a-zA-Z0-9À-ÖØ-öø-ÿ]+$/,latin:/^[a-zA-Z0-9]+$/},i=u(r,t)?t:"default";return Promise.resolve(r[i].test(e))},before({value:e},t=!1){const r=!1!==t?Date.parse(t):Date.now(),i=e instanceof Date?e.getTime():Date.parse(e);return Promise.resolve(!isNaN(i)&&i<r)},between:({value:e},t=0,r=10,i)=>Promise.resolve(null!==t&&null!==r&&!isNaN(t)&&!isNaN(r)&&(!isNaN(Number(e))&&"length"!==i||"value"===i?(e=Number(e),t=Number(t),r=Number(r),e>t&&e<r):("string"==typeof e||"length"===i)&&(e=isNaN(Number(e))?e:e.toString()).length>t&&e.length<r)),confirm:({value:e,formValues:t,name:r},i)=>Promise.resolve((()=>{let o=i;return o||(o=/_confirm$/.test(r)?r.substr(0,r.length-8):r+"_confirm"),t[o]===e})()),date:({value:e},t=!1)=>Promise.resolve(t?function(e){const t=`^${r=e,r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`;var r;const i={MM:"(0[1-9]|1[012])",M:"([1-9]|1[012])",DD:"([012][1-9]|3[01])",D:"([012]?[1-9]|3[01])",YYYY:"\\d{4}",YY:"\\d{2}"};return new RegExp(Object.keys(i).reduce((e,t)=>e.replace(t,i[t]),t))}(t).test(e):!isNaN(Date.parse(e))),email({value:e}){if(!e)return Promise.resolve(!0);return Promise.resolve(/^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(e))},endsWith:({value:e},...t)=>e?"string"==typeof e?Promise.resolve(0===t.length||t.some(t=>e.endsWith(t))):Promise.resolve(!1):Promise.resolve(!0),in:({value:e},...t)=>Promise.resolve(t.some(t=>"object"==typeof t?c(t,e):t===e)),matches:({value:e},...t)=>Promise.resolve(!!t.find(t=>("string"==typeof t&&"/"===t.substr(0,1)&&"/"===t.substr(-1)&&(t=new RegExp(t.substr(1,t.length-2))),t instanceof RegExp?t.test(e):t===e))),max:({value:e},t=10,r)=>Promise.resolve(Array.isArray(e)?(t=isNaN(Number(t))?t:Number(t),e.length<=t):!isNaN(e)&&"length"!==r||"value"===r?(e=isNaN(e)?e:Number(e))<=t:("string"==typeof e||"length"===r)&&(e=isNaN(e)?e:e.toString()).length<=t),min:({value:e},t=1,r)=>Promise.resolve(Array.isArray(e)?(t=isNaN(t)?t:Number(t),e.length>=t):!isNaN(e)&&"length"!==r||"value"===r?(e=isNaN(e)?e:Number(e))>=t:("string"==typeof e||"length"===r)&&(e=isNaN(e)?e:e.toString()).length>=t),not:({value:e},...t)=>Promise.resolve(!t.some(t=>"object"==typeof t?c(t,e):t===e)),number:({value:e})=>Promise.resolve(String(e).length>0&&!isNaN(Number(e))),required:({value:e},t=!0)=>Promise.resolve(!(t&&!["no","false"].includes(t)&&(Array.isArray(e)?!e.length:"string"==typeof e?!e:!("object"!=typeof e||e&&Object.keys(e).length)))),startsWith:({value:e},...t)=>e?"string"==typeof e?Promise.resolve(0===t.length||t.some(t=>e.startsWith(t))):Promise.resolve(!1):Promise.resolve(!0),url:({value:e})=>Promise.resolve(t(e)),bail:()=>Promise.resolve(!0)},m={default:(e,t)=>e.$t("validation.default",t),accepted:(e,t)=>e.$t("validation.accepted",t),after:(e,t,r=!1)=>"string"==typeof r&&r.length?e.$t("validation.after.compare",t):e.$t("validation.after.default",t),alpha:(e,t)=>e.$t("validation.alpha",t),alphanumeric:(e,t)=>e.$t("validation.alphanumeric",t),before:(e,t,r=!1)=>"string"==typeof r&&r.length?e.$t("validation.before.compare",t):e.$t("validation.before.default",t),between(e,t,r=0,i=10,o){const s=Object.assign(Object.assign({},t),{from:r,to:i});return!isNaN(t.value)&&"length"!==o||"value"===o?e.$t("validation.between.force",s):e.$t("validation.between.default",s)},confirm:(e,t)=>e.$t("validation.confirm",t),date:(e,t,r=!1)=>"string"==typeof r&&r.length?e.$t("validation.date.format",t):e.$t("validation.date.default",t),email:(e,t)=>e.$t("validation.email.default",t),endsWith:(e,t)=>e.$t("validation.endsWith.default",t),in:function(e,t){return"string"==typeof t.value&&t.value?e.$t("validation.in.string",t):e.$t("validation.in.default",t)},matches:(e,t)=>e.$t("validation.matches.default",t),max:(e,t,r=10,i)=>Array.isArray(t.value)?e.$tc("validation.max.array",r,t):!isNaN(t.value)&&"length"!==i||"value"===i?e.$tc("validation.max.force",r,t):e.$tc("validation.max.default",r,t),min:(e,t,r=1,i)=>Array.isArray(t.value)?e.$tc("validation.min.array",r,t):!isNaN(t.value)&&"length"!==i||"value"===i?e.$tc("validation.min.force",r,t):e.$tc("validation.min.default",r,t),not:(e,t)=>e.$t("validation.not.default",t),number:(e,t)=>e.$t("validation.number.default",t),required:(e,t)=>e.$t("validation.required.default",t),startsWith:(e,t)=>e.$t("validation.startsWith.default",t),url:(e,t)=>e.$t("validation.url.default",t)};
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
function y(e,t){var r={};for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&t.indexOf(i)<0&&(r[i]=e[i]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(i=Object.getOwnPropertySymbols(e);o<i.length;o++)t.indexOf(i[o])<0&&Object.prototype.propertyIsEnumerable.call(e,i[o])&&(r[i[o]]=e[i[o]])}return r}function g(e,t,r,i){var o,s=arguments.length,a=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,r):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,r,i);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(s<3?o(a):s>3?o(t,r,a):o(t,r))||a);return s>3&&a&&Object.defineProperty(t,r,a),a}class b{constructor(e){this.registry=new Map,this.ctx=e}add(e,t){this.registry.set(e,t)}remove(e){this.registry.delete(e);const t=this.ctx.proxy,r=e,i=(t[r],y(t,["symbol"==typeof r?r:r+""]));this.ctx.proxy=i}has(e){return this.registry.has(e)}hasNested(e){for(const t of this.registry.keys())if(t===e||t.includes(e+"."))return!0;return!1}get(e){return this.registry.get(e)}getNested(e){const t=new Map;for(const r of this.registry.keys())(r===e||r.includes(e+"."))&&t.set(r,this.registry.get(r));return t}forEach(e){this.registry.forEach((t,r)=>{e(t,r)})}keys(){return Array.from(this.registry.keys())}register(e,t){if(this.registry.has(e))return;this.registry.set(e,t);const r=u(t.$options.propsData||{},"value");!r&&this.ctx.hasInitialValue&&void 0!==p(this.ctx.initialValues,e)?t.context.model=p(this.ctx.initialValues,e):r&&!c(t.proxy,p(this.ctx.initialValues,e))&&this.ctx.setFieldValue(e,t.proxy)}reduce(e,t){return this.registry.forEach((r,i)=>{t=e(t,r,i)}),t}}class E{constructor(e=[]){this.observers=[],this.observers=e}add(e){this.observers.some(t=>t.callback===e.callback)||this.observers.push(e)}remove(e){this.observers=this.observers.filter(t=>t.callback!==e)}filter(e){return new E(this.observers.filter(e))}some(e){return this.observers.some(e)}observe(e){this.observers.forEach(t=>{"form"===t.type?t.callback(e):t.field&&!Array.isArray(e)&&u(e,t.field)&&t.callback(e[t.field])})}}let x=class extends r{constructor(){super(...arguments),this.path="",this.proxy={},this.registry=new b(this),this.errorObserverRegistry=new E,this.localFormErrors=[],this.localFieldErrors={}}get initialValues(){return this.hasModel&&"object"==typeof this.formularioValue?Object.assign({},this.formularioValue):{}}get mergedFormErrors(){return[...this.formErrors,...this.localFormErrors]}get mergedFieldErrors(){return d(this.errors||{},this.localFieldErrors)}get hasModel(){return u(this.$options.propsData||{},"formularioValue")}get hasInitialValue(){return this.formularioValue&&"object"==typeof this.formularioValue}onFormularioValueChanged(e){this.hasModel&&e&&"object"==typeof e&&this.setValues(e)}onMergedFormErrorsChanged(e){this.errorObserverRegistry.filter(e=>"form"===e.type).observe(e)}onMergedFieldErrorsChanged(e){this.errorObserverRegistry.filter(e=>"input"===e.type).observe(e)}created(){this.initProxy()}getFormValues(){return this.proxy}onFormSubmit(){return this.hasValidationErrors().then(e=>e?void 0:function e(t){if("object"!=typeof t)return t;const r=Array.isArray(t)?[]:{};for(const i in t)u(t,i)&&(r[i]=h(t[i])?t[i]:e(t[i]));return r}(this.proxy)).then(e=>{void 0!==e?this.$emit("submit",e):this.$emit("error")})}onFormularioFieldValidation(e){this.$emit("validation",e)}addErrorObserver(e){this.errorObserverRegistry.add(e),"form"===e.type?e.callback(this.mergedFormErrors):e.field&&u(this.mergedFieldErrors,e.field)&&e.callback(this.mergedFieldErrors[e.field])}removeErrorObserver(e){this.errorObserverRegistry.remove(e)}register(e,t){this.registry.register(e,t)}deregister(e){this.registry.remove(e)}initProxy(){this.hasInitialValue&&(this.proxy=this.initialValues)}setValues(e){const t=Array.from(new Set([...Object.keys(e),...Object.keys(this.proxy)]));let r=!1;t.forEach(t=>{this.registry.hasNested(t)&&this.registry.getNested(t).forEach((t,i)=>{const o=this.registry.get(i),s=p(this.proxy,i),a=p(e,i);c(a,s)||(this.setFieldValue(i,a,!1),r=!0),c(a,o.proxy)||(o.context.model=a)})}),this.initProxy(),r&&this.$emit("input",Object.assign({},this.proxy))}setFieldValue(e,t,r=!0){if(void 0===t){const t=this.proxy,r=e,i=(t[r],y(t,["symbol"==typeof r?r:r+""]));this.proxy=i}else!function(e,t,r){const i=t.split(".");let o=e;for(let e=0;e<i.length;e++){const t=i[e],s=t.match(/(.+)\[(\d+)\]$/);if(s){if(void 0===o[s[1]]&&(o[s[1]]=[]),o=o[s[1]],e===i.length-1){o[s[2]]=r;break}o=o[s[2]]}else{if(e===i.length-1){o[t]=r;break}void 0===o[t]&&(o[t]={}),o=o[t]}}}(this.proxy,e,t);r&&this.$emit("input",Object.assign({},this.proxy))}setErrors({formErrors:e,inputErrors:t}){this.localFormErrors=e||[],this.localFieldErrors=t||{}}hasValidationErrors(){return Promise.all(this.registry.reduce((e,t)=>(e.push(t.runValidation()&&t.hasValidationErrors()),e),[])).then(e=>e.some(e=>e))}resetValidation(){this.localFormErrors=[],this.localFieldErrors={},this.registry.forEach(e=>{e.resetValidation()})}};function $(e,t,r,i,o,s,a,n,l,u){"boolean"!=typeof a&&(l=n,n=a,a=!1);const d="function"==typeof r?r.options:r;let h;if(e&&e.render&&(d.render=e.render,d.staticRenderFns=e.staticRenderFns,d._compiled=!0,o&&(d.functional=!0)),i&&(d._scopeId=i),s?(h=function(e){(e=e||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||"undefined"==typeof __VUE_SSR_CONTEXT__||(e=__VUE_SSR_CONTEXT__),t&&t.call(this,l(e)),e&&e._registeredComponents&&e._registeredComponents.add(s)},d._ssrRegister=h):t&&(h=a?function(e){t.call(this,u(e,this.$root.$options.shadowRoot))}:function(e){t.call(this,n(e))}),h)if(d.functional){const e=d.render;d.render=function(t,r){return h.call(r),e(t,r)}}else{const e=d.beforeCreate;d.beforeCreate=e?[].concat(e,h):[h]}return r}g([i("input",{default:()=>({})})],x.prototype,"formularioValue",void 0),g([o({default:()=>({})})],x.prototype,"errors",void 0),g([o({default:()=>[]})],x.prototype,"formErrors",void 0),g([s()],x.prototype,"path",void 0),g([a("formularioValue",{deep:!0})],x.prototype,"onFormularioValueChanged",null),g([a("mergedFormErrors")],x.prototype,"onMergedFormErrorsChanged",null),g([a("mergedFieldErrors",{deep:!0,immediate:!0})],x.prototype,"onMergedFieldErrorsChanged",null),g([s()],x.prototype,"getFormValues",null),g([s()],x.prototype,"onFormularioFieldValidation",null),g([s()],x.prototype,"addErrorObserver",null),g([s()],x.prototype,"removeErrorObserver",null),g([s("formularioRegister")],x.prototype,"register",null),g([s("formularioDeregister")],x.prototype,"deregister",null),g([s("formularioSetter")],x.prototype,"setFieldValue",null),x=g([n({name:"FormularioForm"})],x);const N=x;var F=function(){var e=this,t=e.$createElement;return(e._self._c||t)("form",{on:{submit:function(t){return t.preventDefault(),e.onFormSubmit(t)}}},[e._t("default",null,{errors:e.mergedFormErrors})],2)};F._withStripped=!0;const V=$({render:F,staticRenderFns:[]},void 0,N,void 0,!1,void 0,!1,void 0,void 0,void 0);let O=class extends r{get groupPath(){return this.isArrayItem?`${this.path}[${this.name}]`:""===this.path?this.name:`${this.path}.${this.name}`}};g([l({default:""})],O.prototype,"path",void 0),g([o({required:!0})],O.prototype,"name",void 0),g([o({default:!1})],O.prototype,"isArrayItem",void 0),g([s("path")],O.prototype,"groupPath",null),O=g([n({name:"FormularioGrouping"})],O);const P=O;var R=function(){var e=this.$createElement;return(this._self._c||e)("div",[this._t("default")],2)};R._withStripped=!0;const j=$({render:R,staticRenderFns:[]},void 0,P,void 0,!1,void 0,!1,void 0,void 0,void 0);function w(e,t,r,i){return o=>Promise.resolve(e(o,...r)).then(e=>e?null:{rule:t,args:r,context:o,message:i(o,...r)})}function A(e){return/^[\^]/.test(e.charAt(0))?[f(e.substr(1)),e.charAt(0)]:[f(e),null]}function _(e,t,r){return"function"==typeof e?[e,null,null]:Array.isArray(e)&&e.length?function(e,t,r){const i=e.slice(),o=i.shift();if("function"==typeof o)return[o,null,null];if("string"!=typeof o)throw new Error("[Formulario]: For array constraint first element must be rule name or Validator function");const[s,a]=A(o);if(u(t,s))return[w(t[s],s,i,r[s]||r.default),s,a];throw new Error("[Formulario] Can't create validator for constraint: "+JSON.stringify(e))}(e,t,r):"string"==typeof e?function(e,t,r){const i=e.split(":"),[o,s]=A(i.shift()||"");if(u(t,o))return[w(t[o],o,i.length?i.join(":").split(","):[],r[o]||r.default),o,s];throw new Error("[Formulario] Can't create validator for constraint: "+e)}(e,t,r):[()=>Promise.resolve(null),null,null]}function D(e){const t=[];if(e.length){let r=e.shift();t.push(r),e.forEach(e=>{e.bail||e.bail!==r.bail?(r=Object.assign({},e),t.push(r)):r.validators.push(...e.validators)})}return t}function M(e,t){return new Promise(r=>{const i=(e,o=[])=>{if(e.length){const s=e.shift();(function(e,t){return Promise.all(e.validators.map(e=>e(t))).then(e=>e.filter(e=>null!==e))})(s,t).then(t=>0!==t.length&&s.bail||!e.length?r(o.concat(t)):i(e,o.concat(t)))}else r([])};i(function(e){const t=([e,,t])=>({validators:[e],bail:"^"===t}),r=[],i=e.findIndex(([,e])=>e&&"bail"===e.toLowerCase());return i>=0?(r.push(...D(e.splice(0,i+1).slice(0,-1).map(t))),r.push(...e.map(([e])=>({validators:[e],bail:!0})))):r.push(...D(e.map(t))),r}(e))})}const k={DEMAND:"demand",LIVE:"live",SUBMIT:"submit"};let C=class extends r{constructor(){super(...arguments),this.proxy=this.getInitialValue(),this.localErrors=[],this.violations=[],this.validationRun=Promise.resolve()}get fullQualifiedName(){return""!==this.path?`${this.path}.${this.name}`:this.name}get model(){const e=this.hasModel?"value":"proxy";return void 0===this[e]?"":this[e]}set model(e){c(e,this.proxy)||(this.proxy=e),this.$emit("input",e),"function"==typeof this.formularioSetter&&this.formularioSetter(this.context.name,e)}get context(){return Object.defineProperty({name:this.fullQualifiedName,runValidation:this.runValidation.bind(this),violations:this.violations,errors:this.localErrors,allErrors:[...this.localErrors,...this.violations.map(e=>e.message)]},"model",{get:()=>this.model,set:e=>{this.model=e}})}get normalizedValidationRules(){const e={};return Object.keys(this.validationRules).forEach(t=>{e[f(t)]=this.validationRules[t]}),e}get normalizedValidationMessages(){const e={};return Object.keys(this.validationMessages).forEach(t=>{e[f(t)]=this.validationMessages[t]}),e}get hasModel(){return u(this.$options.propsData||{},"value")}onProxyChanged(e,t){this.hasModel||c(e,t)||(this.context.model=e),this.validationBehavior===k.LIVE?this.runValidation():this.violations=[]}onValueChanged(e,t){this.hasModel&&!c(e,t)&&(this.context.model=e)}created(){this.initProxy(),"function"==typeof this.formularioRegister&&this.formularioRegister(this.fullQualifiedName,this),"function"!=typeof this.addErrorObserver||this.errorsDisabled||this.addErrorObserver({callback:this.setErrors,type:"input",field:this.fullQualifiedName}),this.validationBehavior===k.LIVE&&this.runValidation()}beforeDestroy(){this.errorsDisabled||"function"!=typeof this.removeErrorObserver||this.removeErrorObserver(this.setErrors),"function"==typeof this.formularioDeregister&&this.formularioDeregister(this.fullQualifiedName)}getInitialValue(){return u(this.$options.propsData||{},"value")?this.value:""}initProxy(){c(this.context.model,this.proxy)||(this.context.model=this.proxy)}runValidation(){return this.validationRun=this.validate().then(e=>{const t=!c(e,this.violations);if(this.violations=e,t){const e={name:this.context.name,violations:this.violations};this.$emit("validation",e),"function"==typeof this.onFormularioFieldValidation&&this.onFormularioFieldValidation(e)}return this.violations}),this.validationRun}validate(){return M(function e(t,r,i){return"string"==typeof t?e(t.split("|").filter(e=>e.length),r,i):Array.isArray(t)?t.map(e=>_(e,r,i)):[]}(this.validation,this.$formulario.getRules(this.normalizedValidationRules),this.$formulario.getMessages(this,this.normalizedValidationMessages)),{value:this.context.model,name:this.context.name,formValues:this.getFormValues()})}hasValidationErrors(){return new Promise(e=>{this.$nextTick(()=>{this.validationRun.then(()=>e(this.violations.length>0))})})}setErrors(e){var t;this.localErrors=(t=e)?"string"==typeof t?[t]:Array.isArray(t)?t:"object"==typeof t?Object.values(t):[]:[]}resetValidation(){this.localErrors=[],this.violations=[]}};g([l({default:void 0})],C.prototype,"formularioSetter",void 0),g([l({default:()=>()=>{}})],C.prototype,"onFormularioFieldValidation",void 0),g([l({default:void 0})],C.prototype,"formularioRegister",void 0),g([l({default:void 0})],C.prototype,"formularioDeregister",void 0),g([l({default:()=>()=>({})})],C.prototype,"getFormValues",void 0),g([l({default:void 0})],C.prototype,"addErrorObserver",void 0),g([l({default:void 0})],C.prototype,"removeErrorObserver",void 0),g([l({default:""})],C.prototype,"path",void 0),g([i("input",{default:""})],C.prototype,"value",void 0),g([o({required:!0,validator:e=>"string"==typeof e&&e.length>0})],C.prototype,"name",void 0),g([o({default:""})],C.prototype,"validation",void 0),g([o({default:()=>({})})],C.prototype,"validationRules",void 0),g([o({default:()=>({})})],C.prototype,"validationMessages",void 0),g([o({default:k.DEMAND,validator:e=>Object.values(k).includes(e)})],C.prototype,"validationBehavior",void 0),g([o({default:!1})],C.prototype,"errorsDisabled",void 0),g([a("proxy")],C.prototype,"onProxyChanged",null),g([a("value")],C.prototype,"onValueChanged",null),C=g([n({name:"FormularioInput",inheritAttrs:!1})],C);const S=C;var I=function(){var e=this.$createElement;return(this._self._c||e)("div",{staticClass:"formulario-input"},[this._t("default",null,{context:this.context})],2)};I._withStripped=!0;const T=$({render:I,staticRenderFns:[]},void 0,S,void 0,!1,void 0,!1,void 0,void 0,void 0);var z=new class{constructor(){this.validationRules={},this.validationMessages={},this.validationRules=v,this.validationMessages=m}install(e,t){e.prototype.$formulario=this,e.component("FormularioForm",V),e.component("FormularioGrouping",j),e.component("FormularioInput",T),this.extend(t||{})}extend(e){if("object"==typeof e)return this.validationRules=d(this.validationRules,e.validationRules||{}),this.validationMessages=d(this.validationMessages,e.validationMessages||{}),this;throw new Error(`[Formulario]: Formulario.extend() should be passed an object (was ${typeof e})`)}getRules(e={}){return d(this.validationRules,e)}getMessages(e,t){const r=d(this.validationMessages||{},t),i={};for(const t in r)i[t]=(i,...o)=>"string"==typeof r[t]?r[t]:r[t](e,i,...o);return i}};export default z;
