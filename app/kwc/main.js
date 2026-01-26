import { defineCustomElement } from 'vue';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';
import ExampleComponent from './ExampleComponent/ExampleComponent.ce.vue';

setBasePath('/node_modules/@kdcloudjs/shoelace/dist');

const ExampleElement = defineCustomElement(ExampleComponent);

if (!customElements.get('example-component')) {
  customElements.define('example-component', ExampleElement);
}
