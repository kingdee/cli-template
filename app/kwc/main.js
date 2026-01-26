import { defineCustomElement } from 'vue';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';
import ExampleComponent from './ExampleComponent/ExampleComponent.ce.vue';

setBasePath('/node_modules/@kdcloudjs/shoelace/dist');

// Define custom element
const ExampleElement = defineCustomElement(ExampleComponent);

// Register component
// Note: Web Component name must contain a hyphen (-)
if (!customElements.get('example-component')) {
  customElements.define('example-component', ExampleElement);
}
