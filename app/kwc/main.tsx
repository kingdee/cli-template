import React from 'react'
import ReactDOM from 'react-dom/client'
// import ComponentA from './componentA'
// import ComponentB from './componentB'

interface EventPayload {
  time?: number
}

interface ComponentProps {
  title?: string
  onEvent?: (name: string, payload?: EventPayload) => void
}

interface MountOptions {
  title?: string
}

function mount(Component: React.ComponentType<ComponentProps>, props: MountOptions = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = ReactDOM.createRoot(el)
  root.render(<Component {...props} />)
}

// mount(ComponentA, { title: 'A' })
// mount(ComponentB, { title: 'B' })
