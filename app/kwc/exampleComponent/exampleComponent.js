import { KingdeeElement, track } from '@kdcloudjs/kwc';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';

export default class ExampleComponent extends KingdeeElement {
    @track count = 0;

    logoUrl = 'logo.png';

    handleClick() {
        this.count++;
    }
}
