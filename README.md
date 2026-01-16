# KWC React Web Component Template (JavaScript Version)

This template project is configured to build React components as standard Web Components (KWC - Kingdee Web Component).

## Features

- **React 19**: Build native Web Components using React 19 and JSX.
- **Vite Library Mode**: Library build mode optimized for ES modules.
- **JavaScript**: Pure JavaScript development to lower the entry barrier.
- **Vitest**: Modern unit testing setup based on JSDOM.
- **Shoelace**: Integrated Shoelace UI component library.

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

The build process generates:
- `dist/[ComponentName]/index.js`: A compact, minified ES module containing component registration, unmount, and update logic.

## Usage

The library exports `mount`, `unmount`, and `update` functions. After uploading the build artifacts to the Cosmic (Cangqiong) platform via the scaffold, the component can be used in the Cosmic platform.

## Project Structure

- `app/kwc/`: Contains KWC components
  - `ExampleComponent/`: Example implementation of a KWC component
    - `Index.jsx`: Component JS logic
    - `index.module.scss`: Component style file
    - `index.js-meta.kwc`: Component metadata file containing configuration information.
  - `main.jsx`: Entry file for development mode.
- `app/pages/`: Contains pages for KWC components
  - `kwcdemo.page-meta.kwp`: Example page containing the `ExampleComponent` component.
- `vite.config.js`: Vite build configuration.

## Other Matters

### Component Naming

- Component filenames are recommended to use the `.jsx` suffix.
- If using a folder structure, the entry file should be named `Index.jsx` or `index.jsx`.

### Context Information

You can get the form context information via `props.config`. Define `props` in the component:

```javascript
function MyComponent(props) {
  // Access props.config
}
```

The Cosmic platform form passes the `config` object through `props`, which contains the following information:
- `config.metaProps`: Contains properties passed in the component metadata.
- `config.context.dispatchAction`: Used to trigger Cosmic platform form actions, such as showing popups or other operations requiring interaction with form plugins.
- `config.context.data`: Context page data.
- `config.context.getData`: `getter` method for context data, used to get real-time data.
- `config.context.addDataChangeListener`: Used to add data change listeners, triggering a callback when context data changes.
- `config.context.close`: Used to close the current form.
- `config.pageId`: Page ID of the current form.
- `config.formId`: Form ID of the current form.
- `config.controlId`: Control ID of the current component.
- `config.isvId`: ISV ID of the current component.
- `config.moduleId`: Module ID of the current component.

### Getting Context Data

```javascript
import { useState, useEffect } from 'react';
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// Import Shoelace styles
import '@kdcloudjs/shoelace/dist/themes/light.css';
// Import Shoelace components
import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/components/card/card.js';
import '@kdcloudjs/shoelace/dist/components/input/input.js';

// Import styles
import styles from './index.module.scss';

export default function ExampleComponent({ config }) {
    const [contextData, setContextData] = useState({});
    const [input1, setInput1] = useState('');
    const [input2, setInput2] = useState('');

    useEffect(() => {
        const propContext = config?.context;
        if (propContext) {
            // 1. Initialize context data
            setContextData(propContext.data || {});

            // 2. Add data change listener
            if (propContext.addDataChangeListener) {
                const removeListener = propContext.addDataChangeListener((event) => {
                    // 3. Handle context data changes
                    setContextData(event.data || {});
                });

                // 4. Remove listener when component unmounts
                return () => {
                    removeListener();
                };
            }
        }
    }, [config]);

    const handleSubmit = () => {
        const formConfig = {
            parentPageId: config?.pageId,
            formId: 'myForm',
            params: {
                openStyle: { showType: 6 },
                name: input1,
                phone: input2
            }
        };

        const urlConfig = {
            app: config?.app,
            callBackId: 'callBackId'
        };

        showForm(formConfig, urlConfig);
    };

    const handleClose = () => {
        config?.context?.close({ params: 123 });
    };

    return (
        <div className={styles.exampleComponent}>
            <sl-card class={styles.cardOverview}>
                <div slot="header">
                    <strong>React + Shoelace Web Component</strong>
                </div>

                <div className={styles.partContainer}>
                    {/* Part 1: Two inputs and one button */}
                    <div className={`${styles.part} ${styles.partInputs}`}>
                        <sl-input
                            label="Input 1"
                            value={input1}
                            onSlInput={(e) => setInput1(e.target.value)}
                            placeholder="Enter something..."
                            class={styles.inputItem}
                        ></sl-input>
                        <sl-input
                            label="Input 2"
                            value={input2}
                            onSlInput={(e) => setInput2(e.target.value)}
                            placeholder="Enter something else..."
                            class={styles.inputItem}
                        ></sl-input>
                        <sl-button variant="primary" onClick={handleSubmit} class={styles.submitBtn}>
                            Submit
                        </sl-button>
                    </div>

                    {/* Part 2: Two descriptions, shown when contextData has name and phone */}
                    {contextData.name && contextData.phone && (
                        <div className={`${styles.part} ${styles.partDescriptions}`}>
                            <div className={styles.descriptionItem}>
                                <strong>Description 1:</strong>
                                <p>Data exists in the context.</p>
                            </div>
                            <div className={styles.descriptionItem}>
                                <strong>Description 2:</strong>
                                <p>name: {contextData.name}</p>
                                <p>phone: {contextData.phone}</p>
                            </div>
                            <sl-button variant="primary" class={styles.submitBtn} onClick={handleClose}>
                                Close
                            </sl-button>
                        </div>
                    )}
                </div>
            </sl-card>
        </div>
    );
}
```

```scss
// ExampleComponent/index.module.scss
.exampleComponent {
    font-family: var(--sl-font-sans);
    padding: 1rem;
}

.partContainer {
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

.partInputs {
    .inputItem {
        margin-bottom: 1rem;
    }

    .submitBtn {
        width: 100%;
    }
}

.partDescriptions {
    border-left: 4px solid var(--sl-color-primary-600);

    .descriptionItem {
        margin-bottom: 0.5rem;

        p {
            margin: 0.25rem 0 0 0;
            font-size: 0.9rem;
            color: var(--sl-color-neutral-700);
        }
    }
}

.cardOverview {
    max-width: 500px;
}
```
