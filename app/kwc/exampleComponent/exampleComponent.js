import { KingdeeElement, track } from '@kdcloudjs/kwc';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import '@kdcloudjs/shoelace/dist/components/button/button.js';
import '@kdcloudjs/shoelace/dist/components/input/input.js';

export default class ExampleComponent extends KingdeeElement {
    @track count = 0;

    logoUrl = 'logo.png';

    // HTML中禁止任何形式的JS表达式，所有表达式移到JS中处理
    get countText() {
        return `count is ${this.count}`;
    }

    // HTML中禁止任何形式的JS表达式，所有表达式移到JS中处理
    get dynamicClass() {
        return this.count % 2 === 0 ? 'even-count' : 'odd-count';
    }

    connectedCallback() {
        // 禁止调用 super.connectedCallback()
    }

    renderedCallback() {
        // 禁止调用 super.renderedCallback()
        if (this._eventsBound) return;
        this._eventsBound = true;
        this.bindShoelaceEvents();
    }

    disconnectedCallback() {
        if (this._eventsBound) {
            this.unbindShoelaceEvents();
            this._eventsBound = false;
        }
    }

    get shoelaceEventBindings() {
        return [
            ['.hidden-input', 'sl-change', this.handleInputChange],
            ['.hidden-input', 'sl-input', this.handleInputChange]
        ];
    }

    bindShoelaceEvents() {
        this.shoelaceEventBindings.forEach(([selector, event, handler]) => {
            const el = this.template.querySelector(selector);
            el?.addEventListener(event, handler.bind(this));
        });
    }

    unbindShoelaceEvents() {
        this.shoelaceEventBindings.forEach(([selector, event, handler]) => {
            const el = this.template.querySelector(selector);
            el?.removeEventListener(event, handler.bind(this));
        });
    }

    handleClick() {
        this.count++;
    }

    handleInputChange(event) {
        console.log('Input value changed:', event.target.value);
    }
}
