import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ExampleComponent from '../ExampleComponent.ce.vue'

// Mock ResizeObserver for Shoelace components
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ExampleComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(ExampleComponent, {
      global: {
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('sl-')
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Vue + Shoelace Web Component')
  })

  it('increments count when button is clicked', async () => {
    const wrapper = mount(ExampleComponent, {
      global: {
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('sl-')
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Count: 0')
    
    // Find the sl-button
    // Note: Since we are testing the Vue component directly (not the web component wrapper),
    // we interact with the Vue instance.
    const button = wrapper.find('.increment-btn')
    expect(button.exists()).toBe(true)
    
    // Trigger click event
    await button.trigger('click')
    
    expect(wrapper.text()).toContain('Count: 1')
  })
})
