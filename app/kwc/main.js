import '@kdcloudjs/kwc-synthetic-shadow';
import { createElement } from '@kdcloudjs/kwc';
import exampleComponent from './exampleComponent/exampleComponent.js';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';

setBasePath('/');

const element = createElement('kwc-example-component', { is: exampleComponent });
document.body.appendChild(element);
