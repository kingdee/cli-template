import fs from 'fs';
import path from 'path';

/**
 * 遍历组件目录，为每个组件生成入口文件
 * @param componentsDir 组件源码根目录 (app/kwc)
 * @param tempEntryDir 临时入口文件存放目录 (temp-entry)
 * @returns {Record<string, string>} Map<组件名, 入口文件绝对路径>
 */
export function generateEntries(componentsDir: string, tempEntryDir: string): Record<string, string> {
  const entries: Record<string, string> = {};

  if (fs.existsSync(tempEntryDir)) {
    fs.rmSync(tempEntryDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempEntryDir, { recursive: true });

  if (!fs.existsSync(componentsDir)) {
    return entries;
  }

  const components = fs.readdirSync(componentsDir).filter((name) => {
    const dirPath = path.join(componentsDir, name);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, `${name}.ce.vue`));
  });

  components.forEach((component) => {
    const componentFile = path.join(componentsDir, component, `${component}.ce.vue`);
    // 计算相对路径，确保在 Windows 上也能正确 import
    const relativePath = path.relative(tempEntryDir, componentFile).replace(/\\/g, '/');

    const entryContent = `
import { defineCustomElement } from 'vue'
import Component from '${relativePath}'
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js'

const baseUrl = window.location.origin + window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1);
setBasePath(baseUrl + 'public/kwc');

const Element = defineCustomElement(Component)
function register(name = '${component.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}') {
  if (!customElements.get(name)) {
    customElements.define(name, Element)
  }
}
export default { Element, register }
export { Element, register }
`.trim();

    const entryFile = path.join(tempEntryDir, `${component}.ts`);
    fs.writeFileSync(entryFile, entryContent);
    entries[component] = entryFile;
  });

  return entries;
}
