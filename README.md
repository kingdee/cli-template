# KWC React Web Component Template (TypeScript Version)

This template project is configured to build React components as standard Web Components (KWC - Kingdee Web Component).

## Features

- **React 19**: Build native Web Components using React 19 and JSX.
- **Vite Library Mode**: Library build mode optimized for ES modules.
- **TypeScript**: Developed with TypeScript for better type safety and developer experience.
- **Vitest**: Modern unit testing setup based on JSDOM.
- **Shoelace**: Integrated Shoelace UI component library.

## Development

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行单元测试
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
    - `index.tsx`: Component TypeScript logic
    - `index.module.scss`: Component style file
    - `index.js-meta.kwc`: Component metadata file containing configuration information.
  - `main.tsx`: Entry file for development mode.
- `app/pages/`: Contains pages for KWC components
  - `kwcdemo.page-meta.kwp`: Example page containing the `ExampleComponent` component.
- `vite.config.ts`: Vite build configuration.
- `tsconfig.json`: TypeScript configuration file.

## Other Matters

### Component Naming

- Component filenames are recommended to use the `.tsx` suffix.
- If using a folder structure, the entry file should be named `index.tsx`.

### Context Information

You can get the form context information via `props.config`. Define `props` in the component:

```tsx
interface Props {
  config: any; // 根据实际情况定义更具体的类型
}

function MyComponent(props: Props) {
  // 访问 props.config
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

```tsx
import { useState, useEffect } from 'react';
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// 导入Shoelace样式
import '@kdcloudjs/shoelace/dist/themes/light.css';
// 引入 Shoelace 组件
import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/components/card/card.js';
import '@kdcloudjs/shoelace/dist/components/input/input.js';
import '@kdcloudjs/shoelace/dist/components/table/table.js';

// 引入样式
import styles from './index.module.scss';

// 定义上下文数据接口
interface ContextData {
  name?: string;
  phone?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// 定义组件 Props 接口
interface ExampleComponentProps {
  config?: KwcConfig;
}

export default function ExampleComponent({ config }: ExampleComponentProps) {
    const [contextData, setContextData] = useState<ContextData>({});
    const [input1, setInput1] = useState<string>('');
    const [input2, setInput2] = useState<string>('');

    useEffect(() => {
        const propContext = config?.context;
        if (propContext) {
            // 1. 初始化上下文数据
            setContextData(propContext.data || {});

            // 2. 添加数据变化监听器
            if (propContext.addDataChangeListener) {
                const removeListener = propContext.addDataChangeListener((event) => {
                    // 3. 处理上下文数据变化
                    setContextData(event.data || {});
                });

                // 4. 组件销毁时移除监听器
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
        config?.context?.close?.({ params: 123 });
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onSlInput={(e: any) => setInput1(e.target.value)}
                            placeholder="Enter something..."
                            class={styles.inputItem}
                        ></sl-input>
                        <sl-input
                            label="Input 2"
                            value={input2}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onSlInput={(e: any) => setInput2(e.target.value)}
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
            <sl-table columns={[
                {
                    dataIndex: 'name',
                    width: 150,
                    render: (value: string) => `<span style="color: #007bff;">${value}</span>`
                },
                {
                    dataIndex: 'status',
                    width: 100,
                    render: (value: string) => {
                        const color = value === 'active' ? '#28a745' : '#dc3545';
                        return `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
                    }
                },
                {
                    dataIndex: 'score',
                    width: 100,
                    render: (value: number) => {
                        const stars = '★'.repeat(Math.floor(value / 20));
                        return `<span style="color: #ffc107;">${stars}</span>`;
                    }
                }
            ]} dataSource={[
                { name: '用户A', status: 'active', score: 85 },
                { name: '用户B', status: 'inactive', score: 45 },
                { name: '用户C', status: 'active', score: 95 }
            ]}></sl-table>
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
