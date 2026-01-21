import { defineCustomElement } from 'vue';
import ExampleComponent from './ExampleComponent/ExampleComponent.ce.vue';

// Define custom element
const ExampleElement = defineCustomElement(ExampleComponent);

// Register component
// Note: Web Component name must contain a hyphen (-)
if (!customElements.get('example-component')) {
  customElements.define('example-component', ExampleElement);
}
