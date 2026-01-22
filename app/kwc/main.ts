import { defineCustomElement } from 'vue';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';
import ExampleComponent from './ExampleComponent/ExampleComponent.ce.vue';

const isDev = import.meta.env.DEV;
const basePath = isDev
  ? '/node_modules/@kdcloudjs/shoelace/dist'
  : new URL('../../shoelace', import.meta.url).href;

setBasePath(basePath);

// Define custom element
const ExampleElement = defineCustomElement(ExampleComponent);

// Register component
// Note: Web Component name must contain a hyphen (-)
if (!customElements.get('example-component')) {
  customElements.define('example-component', ExampleElement);
}

console.log('KWC Dev Mode: ExampleComponent registered as <example-component>');
