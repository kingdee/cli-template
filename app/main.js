import { defineCustomElement } from 'vue'
import ExampleComponent from './kwc/ExampleComponent/ExampleComponent.ce.vue'

// Create the custom element constructor
const Element = defineCustomElement(ExampleComponent)

// Register the custom element
function register(name = 'vue-element') {
  if (!customElements.get(name)) {
    customElements.define(name, Element)
  }
}

export default { Element, register }
// export default ExampleElement
