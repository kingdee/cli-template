/* eslint-disable no-console */
import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const componentsDir = path.resolve('app/kwc');
const distDir = path.resolve('dist');
const tempEntryDir = path.resolve('temp-entry');

if (fs.existsSync(distDir)) {
  console.log('Cleaning dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

if (fs.existsSync(tempEntryDir)) {
  fs.rmSync(tempEntryDir, { recursive: true, force: true });
}
fs.mkdirSync(tempEntryDir, { recursive: true });

const components: string[] = fs.readdirSync(componentsDir).filter((name: string) => {
  const dirPath = path.join(componentsDir, name);
  if (!fs.statSync(dirPath).isDirectory()) {
    return false;
  }
  return fs.existsSync(path.join(dirPath, `${name}.ce.vue`));
});

console.log(`Found ${components.length} components: ${components.join(', ')}`);

for (const component of components) {
  console.log(`\nBuilding component: ${component}...`);

  // Set env var to tell vite.config.ts to only process this component
  process.env.TARGET_COMPONENT = component;

  // Generate temp entry file
  const componentFile = path.join(componentsDir, component, `${component}.ce.vue`);
  const relativePath = path.relative(tempEntryDir, componentFile).replace(/\\/g, '/');

  const entryContent = `
import { defineCustomElement } from 'vue'
import Component from '${relativePath}'
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js'

const baseUrl = '.'
setBasePath(new URL(baseUrl, import.meta.url).href)

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

  try {
    await build({
      configFile: 'vite.config.ts',
      mode: 'production',
      build: {
        lib: {
          entry: entryFile,
          formats: ['es']
        }
      }
    });

    console.log(`✓ ${component} built successfully`);
  } catch (e) {
    console.error(`✗ Failed to build ${component}:`, e);
    process.exit(1);
  }
}

// Cleanup temp entry directory
if (fs.existsSync(tempEntryDir)) {
  fs.rmSync(tempEntryDir, { recursive: true, force: true });
}

console.log('\nAll components built successfully!');
