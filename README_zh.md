# KWC Vue 3 Web Component 模板 (JavaScript 版)

该模板项目配置为将 Vue 3 组件构建为标准的 Web Components (KWC - Kingdee Web Component)。

## 特性

- **Vue 3 SFC**: 使用 Vue 3 单文件组件 (`.ce.vue`) 构建原生 Web Components。
- **Vite 库模式**: 针对 ES 模块优化的库构建模式。
- **JavaScript**: 纯 JavaScript 开发，降低上手门槛。
- **Vitest**: 基于 JSDOM 的现代单元测试设置。

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
# 生产环境构建
npm run build

# 开发环境构建 (保留临时文件用于调试)
npm run build:dev
```

构建过程会生成：
- `dist/kwc/[ComponentName]/index.js`: 每个组件对应的标准 Web Component 模块。

## 调试

```bash
# 开启本地调试服务及构建监听
npm run debug

# 仅开启本地调试服务 (托管 ./dist 目录)
npm run debug:server

# 开启开发模式下的构建监听
npm run debug:build
```

## 使用方法

该库导出一个 `register` 函数和原始的 `Element` 构造函数。通过脚手架将构建产物上传至苍穹平台后，即可在苍穹平台中使用该组件。

## 项目结构

- `app/kwc/`: 包含 KWC 组件。
  - `ExampleComponent/`: KWC 组件的示例实现。
- `app/main.js`: 入口文件，导出组件构造函数和注册工具。
- `vite.config.js`: Vite 构建配置，包含压缩和 Vue SFC 处理。

## 其他事项

### 组件命名

- 组件文件名需要以 `.ce.vue` 后缀结尾，例如 `ExampleComponent.ce.vue`。
- 组件标签名需要遵循自定义元素命名规范，以连字符分隔，例如 `vue-element`。

### 上下文信息

通过 `props.config` 可以获取到表单的上下文信息。首先，在组件的 `<script>` 标签中定义 `props`：

```javascript
const props = defineProps();
```
苍穹平台表单会通过 `props` 传入 `config` 对象，其它包含了如下信息：

- `config.metaProps`: 包含了组件元数据中传递的属性。
- `config.context.dispatchAction`: 用于触发苍穹平台表单的操作，如展示弹窗或其它需要与表单插件交互的操作。
- `config.context.data`: 上下文页面数据。
- `config.context.getData`: 上下文数据的 `getter` 方法，可用于获取实时数据
- `config.context.addDataChangeListener`: 用于添加数据变化监听器，当上下文数据发生变化时会触发回调。
- `config.context.close`: 用于关闭当前表单。
- `config.pageId`: 当前表单的页面 ID。
- `config.formId`: 当前表单的表单 ID。
- `config.controlId`: 当前组件的控件 ID。
- `config.isvId`: 当前组件的 ISV ID。
- `config.moduleId`: 当前组件的模块 ID。

### 获取上下文数据

```js
const props = defineProps(['config']);
const contextData = ref(null);

watchEffect(() => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. 初始化上下文数据
    contextData.value = propContext.data;

    // 2. 添加数据变化监听器
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event) => {
        // 3. 处理上下文数据变化
        contextData.value = event.data;
      });

      // 4. 组件销毁时移除监听器
      onCleanup(() => {
        removeListener();
      })
    }
  }
})
```

### 打开表单

在苍穹平台中使用时，如需打开其它苍穹平台的表单， 需要引入 `@kdcloudjs/kwc-shared-utils` 库。该库提供了 `showForm` 方法，用于打开其它表单。

```javascript
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

// 假设点击某个按钮后打开另一个表单
const handleClick = () => {
  const formConfig = {
    parentPageId: props.config.pageId, // 当前页面Id
    formId: 'another-form-id', // 目标表单Id
    params: {
      openStyle: { showType: 6 }, // 打开表单的方式
      // ... 其他参数
    }
  };

  const urlConfig = {
    app: props.config.app, // 应用Id,
    callBackId: '' // 回调函数Id，当目标页面关闭时如需回调时传入
  }

  showForm(formConfig, urlConfig);
}
```

### 关闭表单

要关闭当前组件所在的表单时，需要调用 `config.context.close` 方法。该方法会关闭当前表单，并触发回调函数。

```javascript
// 假设点击某个按钮后关闭当前表单
const handleClick = () => {
  // 需要回调参数给父级页面时，可以传入参数
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
import type { KwcConfig, KwcDataChangeEvent } from '../types';
import { showForm } from '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/components/card/card.js';
import '@kdcloudjs/shoelace/dist/components/input/input.js';

const props = defineProps(['config']);
const contextData = ref(null);

watchEffect(() => {
  const propContext = props.config?.context;
  if (propContext) {
    // 1. 初始化上下文数据
    contextData.value = propContext.data;

    // 2. 添加数据变化监听器
    if (propContext.addDataChangeListener) {
      const removeListener = propContext.addDataChangeListener((event: KwcDataChangeEvent) => {
        // 3. 处理上下文数据变化
        contextData.value = event.data;
      });

      // 4. 组件销毁时移除监听器
      onWatchedCleanup(() => {
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