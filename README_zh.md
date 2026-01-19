# KWC React Web Component 模板（TypeScript 版）

该模板项目配置为将 React 组件构建为标准的 Web Components (KWC - Kingdee Web Component)。

## 特性

- **React 19**: 使用 React 19 和 JSX 构建原生 Web Components。
- **Vite 库模式**: 针对 ES 模块优化的库构建模式。
- **TypeScript**: 使用 TypeScript 开发，提供更好的类型安全和开发体验。
- **Vitest**: 基于 JSDOM 的现代单元测试设置。
- **Shoelace**: 集成 Shoelace UI 组件库。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行单元测试
npm run test
```

## 构建

```bash
npm run build
```

构建过程会生成：
- `dist/[ComponentName]/index.js`: 一个紧凑、经过压缩的 ES 模块，包含组件注册、卸载、更新逻辑。

## 使用方法

该库导出一个 `mount`、`unmount`、`update` 函数。通过脚手架将构建产物上传至苍穹平台后，即可在苍穹平台中使用该组件。

## 项目结构

- `app/kwc/`: 包含 KWC 组件
  - `ExampleComponent/`: KWC 组件的示例实现
    - `index.tsx`: 组件的 TypeScript 逻辑
    - `index.module.scss`: 组件的样式文件
    - `index.js-meta.kwc`: 组件的元数据文件，包含组件的配置信息。
  - `main.tsx`: 开发模式下入口文件。
- `app/pages/`: 包含 kwc 组件的页面
  - `kwcdemo.page-meta.kwp`: 示例页面，包含 `ExampleComponent` 组件。
- `vite.config.ts`: Vite 构建配置。
- `tsconfig.json`: TypeScript 配置文件。

## 其他事项

### 组件命名

- 组件文件名建议使用 `.tsx` 后缀
- 如果使用文件夹结构，入口文件应命名为 `index.tsx`。

### 上下文信息

通过 `props.config` 可以获取到表单的上下文信息。在组件中定义 `props`：

```tsx
interface Props {
  config: any; // 根据实际情况定义更具体的类型
}

function MyComponent(props: Props) {
  // 访问 props.config
}
```

苍穹平台表单会通过 `props` 传入 `config` 对象，其中包含了如下信息：

- `config.metaProps`: 包含了组件元数据中传递的属性。
- `config.context.dispatchAction`: 用于触发苍穹平台表单的操作，如展示弹窗或其它需要与表单插件交互的操作。
- `config.context.data`: 上下文页面数据。
- `config.context.getData`: 上下文数据的 `getter` 方法，可用于获取实时数据。
- `config.context.addDataChangeListener`: 用于添加数据变化监听器，当上下文数据发生变化时会触发回调。
- `config.context.close`: 用于关闭当前表单。
- `config.pageId`: 当前表单的页面 ID。
- `config.formId`: 当前表单的表单 ID。
- `config.controlId`: 当前组件的控件 ID。
- `config.isvId`: 当前组件的 ISV ID。
- `config.moduleId`: 当前组件的模块 ID。

### 获取上下文数据

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

