import { KingdeeElement, api } from '@kdcloudjs/kwc';

export default class App extends KingdeeElement {
    @api config;
    connectedCallback() {
        console.log('yrbTest connected, config =', this.config);
    }
    handleClick() {
          this.dispatchEvent(
            new CustomEvent('yrbTestClick', {
                detail: { message: 'yrbTest clicked from yrbTest component!' },
                bubbles: true,
                composed: true
            })
          );
        alert('yrbTest clicked, 向低代码传递数据!');
    }
}