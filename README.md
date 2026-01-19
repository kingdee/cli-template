# KWC Vue 3 Web Component Template (TypeScript)

This template project is configured to build Vue 3 components as standard Web Components (KWC - Kingdee Web Component).

## Features

- **Vue 3 SFC**: Build native Web Components using Vue 3 Single File Components (`.ce.vue`).
- **Vite Lib Mode**: Optimized library build focusing on ES modules.
- **TypeScript**: Full type support, providing type safety and better development experience.
- **Vitest**: Modern unit testing setup with JSDOM.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test
```

## Build

```bash
# Build for production
npm run build

# Build for development (keeps temp files for debugging)
npm run build:dev
```

The build process produces:
- `dist/kwc/[ComponentName]/index.js`: Standard Web Component modules for each component.

## Debug

```bash
# Debug with local server and build watch
npm run debug

# Start debug server only (serves ./dist)
npm run debug:server

# Build with watch mode in development mode
npm run debug:build
```

## Usage

The library exports a `register` function and the raw `Element` constructor. Once the build artifact is uploaded to the Cosmic platform via the CLI, the component can be used within the Cosmic platform.

## Project Structure

- `app/kwc/`: Contains KWC components.
  - `ExampleComponent/`: Example implementation of a KWC component.
  - `types.ts`: TypeScript type definitions for KWC context and configuration.
- `app/main.ts`: Entry file, exporting component constructor and registration utility.
- `vite.config.ts`: Vite build configuration, including minification and Vue SFC handling.

## Other Matters

### Component Naming

- Component filenames must end with the `.ce.vue` suffix, e.g., `ExampleComponent.ce.vue`.
- Component tag names must follow the custom element naming convention, separated by hyphens, e.g., `vue-element`.

### Context Information

You can access the form's context information via `props.config`. First, define `props` in the component's `<script setup lang="ts">` tag and use the `KwcConfig` type:

```typescript
import { defineProps } from 'vue';
import type { KwcConfig } from '../types';

const props = defineProps<{
  config?: KwcConfig
}>();
```

The Cosmic platform form will pass a `config` object via `props`, which contains the following information:

- `config.props`: Contains properties passed in the component metadata.
- `config.context.dispatchAction`: Used to trigger operations on the Cosmic platform form, such as showing a modal or other interactions with form plugins.
- `config.context.data`: Context page data.
- `config.context.getData`: A `getter` method for context data, used to retrieve real-time data.
- `config.context.addDataChangeListener`: Used to add a data change listener, triggering a callback when context data changes.
- `config.context.close`: Used to close the current form.
- `config.pageId`: The page ID of the current form.
- `config.formId`: The form ID of the current form.
- `config.controlId`: The control ID of the current component.
- `config.isvId`: The ISV ID of the current component.
- `config.moduleId`: The module ID of the current component.

### Getting Context Data

```typescript
import { ref, watchEffect, onWatcherCleanup } from 'vue';
import type { KwcDataChangeEvent } from '../types';

const props = defineProps<{
  config?: KwcConfig
}>();

const contextData = ref<any>(null);

watchEffect(() => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. Initialize context data
    contextData.value = propContext.data;

    // 2. Add data change listener
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event: KwcDataChangeEvent) => {
        // 3. Handle context data changes
        contextData.value = event.data;
      });

      // 4. Remove listener when component is destroyed
      onWatcherCleanup(() => {
        removeListener();
      })
    }
  }
})
```

### Opening a Form

When using in the Cosmic platform, if you need to open other Cosmic platform forms, you need to import the `@kdcloudjs/kwc-shared-utils` library. This library provides the `showForm` method for opening other forms.

```typescript
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// Assuming another form is opened after clicking a button
const handleClick = () => {
  const formConfig = {
    parentPageId: props.config?.pageId, // Current Page ID
    formId: 'another-form-id', // Target Form ID
    params: {
      openStyle: { showType: 6 }, // Way to open the form
      // ... other parameters
    }
  };

  const urlConfig = {
    app: props.config?.moduleId, // Module ID or App ID
    callBackId: '' // Callback Function ID, passed if a callback is needed when the target page closes
  }

  showForm(formConfig, urlConfig);
}
```

### Closing a Form

To close the form where the current component resides, you need to call the `config.context.close` method. This method will close the current form and trigger the callback function.

```typescript
// Assuming the current form is closed after clicking a button
const handleClick = () => {
  // If callback parameters are needed for the parent page, parameters can be passed
  const callbackParams = {
    // ...
  }
  props.config?.context?.close(callbackParams);
}
```

## Demo

```vue
<!-- ExampleComponent.ce.vue -->
<script setup lang="ts">
import { ref, watchEffect, onWatcherCleanup } from 'vue';
import type { KwcConfig, KwcDataChangeEvent } from '../types';
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// Define props and specify types
const props = defineProps<{
  config?: KwcConfig
}>();

const contextData = ref<any>(null);

watchEffect(() => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. Initialize context data
    contextData.value = propContext.data;

    // 2. Add data change listener
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event: KwcDataChangeEvent) => {
        // 3. Handle context data changes
        contextData.value = event.data;
      });

      // 4. Remove listener when component is destroyed
      onWatcherCleanup(() => {
        removeListener();
      })
    }
  }
})

const input1 = ref('');
const input2 = ref('');

const handleSubmit = () => {
  const formConfig = {
      parentPageId: props.config?.pageId,
      formId: 'myForm',
      params: {
        openStyle: { showType: 6 },
        name: input1.value,
        phone: input2.value
      }
    }

    const urlConfig = {
      app: props.config?.moduleId,
      callBackId: 'callBackId'
    }
    showForm(formConfig, urlConfig)
};

const handleClose = () => {
  props.config?.context?.close({ params: 123 });
}
</script>

<template>
  <div class="example-component">
    <div class="card-overview">
      <div class="card-header">
        <strong>Vue Web Component</strong>
      </div>

      <div class="part-container">
        <!-- Part 1: Two inputs and one button -->
        <div class="part part-inputs">
          <div class="input-group">
            <label>Input 1</label>
            <input 
              v-model="input1" 
              type="text"
              placeholder="Enter something..."
              class="input-item"
            />
          </div>
          <div class="input-group">
            <label>Input 2</label>
            <input 
              v-model="input2" 
              type="text"
              placeholder="Enter something else..."
              class="input-item"
            />
          </div>
          <button @click="handleSubmit" class="submit-btn">
            Submit
          </button>
        </div>

        <!-- Part 2: Two descriptions, shown when props.config.context.data exists -->
        <div v-if="contextData && contextData.name && contextData.phone" class="part part-descriptions">
          <div class="description-item">
            <strong>Description 1:</strong>
            <p>Data exists in the context.</p>
          </div>
          <div class="description-item">
            <strong>Description 2:</strong>
            <p>name: {{ contextData.name }}</p>
            <p>phone: {{ contextData.phone }}</p>
          </div>
          <button class="submit-btn close-btn" @click="handleClose">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.example-component {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 1rem;

  .card-overview {
    max-width: 500px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    background: #f9f9f9;
  }

  .part-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }

  .part {
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 6px;
    background-color: #fafafa;
  }

  .input-group {
    margin-bottom: 1rem;
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
  }

  .input-item {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }

  .submit-btn {
    width: 100%;
    padding: 0.6rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: #0056b3;
    }

    &.close-btn {
      margin-top: 0.5rem;
      background-color: #6c757d;

      &:hover {
        background-color: #5a6268;
      }
    }
  }

  .part-descriptions {
    border-left: 4px solid #007bff;
    
    .description-item {
      margin-bottom: 0.5rem;
      
      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.9rem;
        color: #555;
      }
    }
  }
}
</style>
