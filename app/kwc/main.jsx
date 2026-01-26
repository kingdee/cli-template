import React from 'react';
import ReactDOM from 'react-dom/client';
import ExampleComponent from './ExampleComponent/ExampleComponent.jsx';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';

setBasePath(import.meta.env.SHOELACE_BASE_URL);

function mount(Component, props = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    root.render(React.createElement(Component, props));
}

mount(ExampleComponent)
