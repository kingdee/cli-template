import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExampleComponent from '../ExampleComponent.ce.vue';

describe('ExampleComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(ExampleComponent);
    expect(wrapper.text()).toContain('Log to Console');
  });

  it('updates input value', async () => {
    const wrapper = mount(ExampleComponent);
    const input = wrapper.find('.demo-input');
    expect(input.exists()).toBe(true);

    await input.setValue('Hello World');
    expect(input.element.value).toBe('Hello World');
  });
});
