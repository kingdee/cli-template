import { defineCustomElement } from 'vue';
import ExampleComponent from './kwc/ExampleComponent/ExampleComponent.ce.vue';

// Define custom element
const ExampleElement = defineCustomElement(ExampleComponent);

// Register component
// Note: Web Component name must contain a hyphen (-)
if (!customElements.get('example-component')) {
  customElements.define('example-component', ExampleElement);
}

console.log('KWC Dev Mode: ExampleComponent registered as <example-component>');
