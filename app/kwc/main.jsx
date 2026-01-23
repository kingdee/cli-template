import React from 'react';
import ReactDOM from 'react-dom/client';
import ExampleComponent from './ExampleComponent/ExampleComponent.jsx';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';

const isDev = import.meta.env.DEV;
const basePath = isDev
    ? import.meta.env.SHOELACE_BASE_URL
    : new URL('../../shoelace', import.meta.url).href;

setBasePath(basePath);

function mount(Component, props = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    root.render(React.createElement(Component, props));
}

mount(ExampleComponent)
