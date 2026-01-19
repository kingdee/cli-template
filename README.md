# KWC Vue 3 Web Component Template (JavaScript)

This template project is configured to build Vue 3 components as standard Web Components (KWC - Kingdee Web Component).

## Features

- **Vue 3 SFC**: Build native Web Components using Vue 3 Single File Components (`.ce.vue`).
- **Vite Lib Mode**: Optimized library build focusing on ES modules.
- **JavaScript**: Pure JavaScript development for simplicity and flexibility.
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

The library exports a `register` function and the raw `Element` constructor. After uploading the build artifacts to the Cosmic Platform (苍穹平台) via the CLI, you can use the component in the platform.

## Project Structure

- `app/kwc/`: Contains KWC components.
  - `ExampleComponent/`: Example implementation of a KWC component.
- `app/main.js`: Entry point that exports the component constructor and registration utility.
- `vite.config.js`: Configuration for Vite build, minification, and Vue SFC handling.

## Guidelines

### Component Naming

- Component filenames must end with the `.ce.vue` suffix, e.g., `ExampleComponent.ce.vue`.
- Component tag names must follow the custom element naming convention (hyphen-separated), e.g., `vue-element`.

### Context Information

You can access the form's context information via `props.config`. First, define `props` in the component's `<script>` tag:

```javascript
const props = defineProps();
```

The Cosmic Platform form passes the `config` object via `props`, which contains the following information:

- `config.metaProps`: Properties passed from the component metadata.
- `config.context.dispatchAction`: Used to trigger Cosmic Platform form actions, such as showing modals or interacting with form plugins.
- `config.context.data`: Context page data.
- `config.context.getData`: Getter method for context data, used to retrieve real-time data.
- `config.context.addDataChangeListener`: Used to add a data change listener, triggering a callback when context data changes.
- `config.context.close`: Used to close the current form.
- `config.pageId`: Current form's Page ID.
- `config.formId`: Current form's Form ID.
- `config.controlId`: Current component's Control ID.
- `config.isvId`: Current component's ISV ID.
- `config.moduleId`: Current component's Module ID.

### Accessing Context Data

```js
const props = defineProps(['config']);
const contextData = ref(null);

watchEffect((onCleanup) => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. Initialize context data
    contextData.value = propContext.data;

    // 2. Add data change listener
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event) => {
        // 3. Handle context data change
        contextData.value = event.data;
      });

      // 4. Remove listener when component is destroyed or dependencies change
      onCleanup(() => {
        removeListener();
      })
    }
  }
})
```

### Opening Forms

When used in the Cosmic Platform, if you need to open other platform forms, you need to import the `@kdcloudjs/kwc-shared-utils` library. This library provides the `showForm` method.

```javascript
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// Assuming another form is opened after clicking a button
const handleClick = () => {
  const formConfig = {
    parentPageId: props.config.pageId, // Current Page ID
    formId: 'another-form-id', // Target Form ID
    params: {
      openStyle: { showType: 6 }, // Open style
      // ... other parameters
    }
  };

  const urlConfig = {
    app: props.config.app, // App ID
    callBackId: '' // Callback ID, passed if a callback is needed when the target page closes
  }

  showForm(formConfig, urlConfig);
}
```

### Closing Forms

To close the form where the current component resides, call the `config.context.close` method. This method closes the current form and triggers the callback function.

```javascript
// Assuming the current form is closed after clicking a button
const handleClick = () => {
  // If you need to pass callback parameters to the parent page
  const callbackParams = {
    // ...
  }
  props.config.context.close(callbackParams);
}
```

## Demo

```javascript
// ExampleComponent.ce.vue
<script setup>
import { ref, watchEffect } from 'vue';
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/components/card/card.js';
import '@kdcloudjs/shoelace/dist/components/input/input.js';

const props = defineProps(['config']);
const contextData = ref(null);

watchEffect((onCleanup) => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. Initialize context data
    contextData.value = propContext.data;

    // 2. Add data change listener
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event) => {
        // 3. Handle context data change
        contextData.value = event.data;
      });

      // 4. Remove listener when component is destroyed
      onCleanup(() => {
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
      app: props.config?.app,
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
    <sl-card class="card-overview">
      <div slot="header">
        <strong>Vue + Shoelace Web Component</strong>
      </div>

      <div class="part-container">
        <!-- Part 1: Two inputs and one button -->
        <div class="part part-inputs">
          <sl-input 
            label="Input 1" 
            v-model="input1" 
            placeholder="Enter something..."
            class="input-item"
          ></sl-input>
          <sl-input 
            label="Input 2" 
            v-model="input2" 
            placeholder="Enter something else..."
            class="input-item"
          ></sl-input>
          <sl-button variant="primary" @click="handleSubmit" class="submit-btn">
            Submit
          </sl-button>
        </div>

        <!-- Part 2: Two descriptions, shown when props.config.context.data exists -->
        <div v-if="contextData.name && contextData.phone" class="part part-descriptions">
          <div class="description-item">
            <strong>Description 1:</strong>
            <p>Data exists in the context.</p>
          </div>
          <div class="description-item">
            <strong>Description 2:</strong>
            <p>name: {{ contextData.name }}</p>
            <p>phone: {{ contextData.phone }}</p>
          </div>
          <sl-button variant="primary" class="submit-btn" @click="handleClose">
            Close
          </sl-button>
        </div>
      </div>
    </sl-card>
  </div>
</template>

<style lang="scss">
.example-component {
  font-family: var(--sl-font-sans);
  padding: 1rem;

  .part-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .part {
    padding: 1rem;
    border: 1px solid var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
    background-color: var(--sl-color-neutral-50);
  }

  .part-inputs {
    .input-item {
      margin-bottom: 1rem;
    }
    .submit-btn {
      width: 100%;
    }
  }

  .part-descriptions {
    border-left: 4px solid var(--sl-color-primary-600);
    
    .description-item {
      margin-bottom: 0.5rem;
      
      p {
        margin: 0.25rem 0 0 0;
        font-size: 0.9rem;
        color: var(--sl-color-neutral-700);
      }
    }
  }
}

.card-overview {
  max-width: 500px;
}
</style>
```
