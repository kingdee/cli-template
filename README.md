# KWC Vue 3 Web Component Template

This template project is configured to build Vue 3 components as standard Web Components (KWC - Kingdee Web Component).

## Features

- **Vue 3 SFC**: Build native Web Components using Vue 3 Single File Components (`.ce.vue`).
- **Vite Lib Mode**: Optimized library build focusing on ES modules.
- **TypeScript**: Full type safety with shared interfaces for KWC context and configurations.
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
npm run build
```

The build process produces:
- `dist/kwc-template-vue.es.js`: A compact, minified ES module containing the custom element and registration logic.

## Usage

The library exports a `register` function and the raw `Element` constructor.

### 1. Registration

In your application entry point:

```javascript
import KWC from './dist/kwc-template-vue.es.js';

// Register with a custom tag name (defaults to 'vue-element')
KWC.register('my-custom-component');
```

### 2. Integration with KWC Props

The component expects a `config` prop following the `KwcConfig` interface:

```html
<my-custom-component id="example"></my-custom-component>

<script>
  const el = document.getElementById('example');
  el.config = {
    context: {
      data: { /* initial data */ },
      dispatchAction: (action, params) => console.log(action, params),
      // ... other KwcContext methods
    },
    pageId: 'page-001'
  };
</script>
```

## Project Structure

- `app/kwc/`: Contains KWC components and shared types.
  - `ExampleComponent/`: Example implementation of a KWC component.
  - `types.ts`: Shared TypeScript interfaces for `KwcConfig`, `KwcContext`, etc.
- `app/main.ts`: Entry point that exports the component constructor and registration utility.
- `vite.config.ts`: Configuration for Vite build, minification, and Vue SFC handling.

## Build Optimization

- **Minification**: Powered by `esbuild` for maximum performance and smallest bundle size.
- **Clean Output**: Automatically removes `console.log` and `debugger` statements in production builds.
- **ESM Only**: Focused on modern ES module output to avoid legacy overhead.
