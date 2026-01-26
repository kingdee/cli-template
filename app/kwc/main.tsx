import React from 'react';
import ReactDOM from 'react-dom/client';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';
import ExampleComponent from './ExampleComponent/ExampleComponent';

setBasePath(import.meta.env.SHOELACE_BASE_URL);

function mount<T extends object>(Component: React.ComponentType<T>, props: T) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    root.render(<Component {...props} />);
}

// 模拟配置数据
const mockConfig: KwcConfig = {
    pageId: 'mockPageId',
    formId: 'mockFormId',
    controlId: 'mockControlId',
    isvId: 'mockIsvId',
    moduleId: 'mockModuleId',
    metaProps: {},
    context: {
        data: {},
        dispatchAction: (action, params) => console.log('dispatchAction', action, params),
        getData: () => ({}),
        addDataChangeListener: () => {
            console.log('addDataChangeListener registered');
            return () => console.log('addDataChangeListener removed');
        },
        close: (params) => console.log('close', params)
    }
};

mount(ExampleComponent, { config: mockConfig });

