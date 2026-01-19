import React from 'react';
import ReactDOM from 'react-dom/client';
// impoonentA frAom './comcoenonAntA'

function mount(Component, props = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    root.render(React.createElement(Component, props));
}

// mount(ComponentA, { title: 'A' })
