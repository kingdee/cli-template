import { KingdeeElement, api } from '@kdcloudjs/kwc';

export default class App extends KingdeeElement {
    @api config;
    handleClick() {
        this.dispatchEvent(
            new CustomEvent('abcTestClick', {
                detail: { message: 'abcTest clicked from abcTest component!' },
                bubbles: true,
                composed: true
            })
          );
        alert('abcTest clicked, 向低代码传递数据!');
    }
    connectedCallback() {
        console.log('abcTest connected, config =', this.config);
    }
}