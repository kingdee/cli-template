import * as fs from 'fs';
import * as path from 'path';

export function generateEntries(componentsDir: string, tempEntryDir: string): Record<string, string> {
  const entryPoints: Record<string, string> = {};
  const shoelaceIconsDir = path.resolve('node_modules/@kdcloudjs/shoelace/dist/assets/icons');

  // 确保临时目录存在
  if (fs.existsSync(tempEntryDir)) {
    fs.rmSync(tempEntryDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempEntryDir, { recursive: true });

  // 扫描组件
  if (!fs.existsSync(componentsDir)) {
    return entryPoints;
  }

  const components = fs.readdirSync(componentsDir).filter(name => {
    return fs.statSync(path.join(componentsDir, name)).isDirectory();
  });

  components.forEach(componentName => {
    const componentPathTsx = path.join(componentsDir, componentName, `${componentName}.tsx`);
    const componentPathTs = path.join(componentsDir, componentName, `${componentName}.ts`);
    const componentPathIndexTsx = path.join(componentsDir, componentName, 'index.tsx');
    const componentPathIndexTs = path.join(componentsDir, componentName, 'index.ts');

    let fileExtension;
    let fileName;

    if (fs.existsSync(componentPathTsx)) {
      fileExtension = '.tsx';
      fileName = componentName;
    } else if (fs.existsSync(componentPathTs)) {
      fileExtension = '.ts';
      fileName = componentName;
    } else if (fs.existsSync(componentPathIndexTsx)) {
      fileExtension = '.tsx';
      fileName = 'index';
    } else if (fs.existsSync(componentPathIndexTs)) {
      fileExtension = '.ts';
      fileName = 'index';
    } else {
      return; // 如果文件都不存在，则跳过该组件
    }

    const filePath = path.join(componentsDir, componentName, `${fileName}${fileExtension}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const iconMatches = [...fileContent.matchAll(/<sl-icon[^>]+name=["']([^"']+)["']/g)];
    const usedIcons = new Set(iconMatches.map(m => m[1]));

    const iconMap: Record<string, string> = {};
    for (const iconName of usedIcons) {
      const iconPath = path.join(shoelaceIconsDir, `${iconName}.svg`);
      if (fs.existsSync(iconPath)) {
        iconMap[iconName] = fs.readFileSync(iconPath, 'utf-8');
      } else {
        console.warn(`Warning: Icon ${iconName} not found in Shoelace assets.`);
      }
    }

    const haveIcons = Object.keys(iconMap).length > 0;
    const iconRegistrationImport = haveIcons ? `
      import { registerIconLibrary } from '@kdcloudjs/shoelace/dist/utilities/icon-library.js';
      ` : '';
    const iconRegistrationCode = haveIcons ? `
      const icons = ${JSON.stringify(iconMap)};

      registerIconLibrary('default', {
        resolver: name => {
          if (icons[name]) {
            return \`data:image/svg+xml,\${encodeURIComponent(icons[name])}\`;
          }
          return '';
        },
        mutator: svg => svg.setAttribute('fill', 'currentColor')
      });
      ` : '';
    const entryContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
${iconRegistrationImport}

import Component from '../app/kwc/${componentName}/${fileName}${fileExtension}';

${iconRegistrationCode}

let root: ReactDOM.Root | null = null;

export function mount(mountPoint: HTMLElement, props = {}) {
  root = ReactDOM.createRoot(mountPoint);
  root.render(React.createElement(Component, props));
  return mountPoint;
}

// 更新组件
export function update(props = {}) {
  if (root) {
    root.render(React.createElement(Component, props));
  }
}

// 卸载组件
export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

export default {
  Component,
  mount,
  update,
  unmount
};

// 同时导出独立的方法
export { Component };
`.trim();

    // 写入临时入口文件
    const entryFile = path.join(tempEntryDir, `${componentName}${fileExtension}`);
    fs.writeFileSync(entryFile, entryContent);

    // 记录入口点
    entryPoints[componentName] = entryFile;
  });

  return entryPoints;
}
