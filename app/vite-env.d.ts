/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}

declare module '@kdcloudjs/shoelace/dist/utilities/base-path.js' {
  export function setBasePath(path: string): void;
}
