import { defineCustomElement } from 'vue'
import Component from '../app/kwc/ExampleComponent/ExampleComponent.ce.vue'

// Create the custom element constructor
const Element = defineCustomElement(Component)

// Register the custom element
function register(name = 'example-component') {
  if (!customElements.get(name)) {
    customElements.define(name, Element)
  }
}

export default { Element, register }
export { Element, register }