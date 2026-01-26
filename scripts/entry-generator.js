import * as fs from 'fs';
import * as path from 'path';

export function generateEntries(componentsDir, tempEntryDir) {
  const entryPoints = {};
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
        const componentPathJsx = path.join(componentsDir, componentName, `${componentName}.jsx`);
        const componentPathJs = path.join(componentsDir, componentName, `${componentName}.js`);

        let fileExtension;
        if (fs.existsSync(componentPathJsx)) {
            fileExtension = '.jsx';
        } else if (fs.existsSync(componentPathJs)) {
            fileExtension = '.js';
        } else {
            return; // 如果两种文件都不存在，则跳过该组件
        }

        const filePath = fileExtension === '.jsx' ? componentPathJsx : componentPathJs;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const iconMatches = [...fileContent.matchAll(/<sl-icon[^>]+name=["']([^"']+)["']/g)];
        const usedIcons = new Set(iconMatches.map(m => m[1]));

        const iconMap = {};
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
import Component from '../app/kwc/${componentName}/${componentName}${fileExtension}';

${iconRegistrationCode}

let root = null;

export function mount(mountPoint, props = {}) {
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
        const entryFile = path.join(tempEntryDir, `${componentName}.jsx`);
        fs.writeFileSync(entryFile, entryContent);

        // 记录入口点
        entryPoints[componentName] = entryFile;
    });

    return entryPoints;
}
