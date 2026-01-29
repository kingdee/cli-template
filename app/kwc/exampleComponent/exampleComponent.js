import { KingdeeElement, track } from '@kdcloudjs/kwc';
import { t, init } from '@kdcloudjs/kwc-shared-utils/i18n';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';

export default class ExampleComponent extends KingdeeElement {
  @track count = 0;

  logoUrl = 'logo.png';

  connectedCallback() {
    init().then(() => {
      console.log(t('myButton.clickMe'));
    });
  }

  handleClick() {
    this.count++;
  }
}
