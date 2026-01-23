import '@kdcloudjs/kwc-synthetic-shadow';
import { createElement } from '@kdcloudjs/kwc';
import exampleComponent from './exampleComponent/exampleComponent.js';

const element = createElement('kwc-example-component', { is: exampleComponent });
document.body.appendChild(element);
