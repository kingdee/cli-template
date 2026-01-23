import { KingdeeElement, track } from '@kdcloudjs/kwc';

export default class ExampleComponent extends KingdeeElement {
  @track count = 0;

  logoUrl = 'logo.png';

  handleClick() {
    this.count++;
  }
}
