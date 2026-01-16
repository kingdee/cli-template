import React from 'react';
import ReactDOM from 'react-dom/client';
// import ComponentA from './componentA';

function mount(Component, props = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    root.render(<Component {...props} />);
}

// mount(ComponentA, { title: 'A' });