import '@kdcloudjs/kwc-synthetic-shadow';
import { createElement } from '@kdcloudjs/kwc';
import AbcTest from './abcTest/abcTest.js';

const element = createElement('abc-test', { is: AbcTest });
document.body.appendChild(element);