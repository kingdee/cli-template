import { KingdeeElement, track } from '@kdcloudjs/kwc';
import '@kdcloudjs/shoelace/dist/components/icon/icon.js';
import { setBasePath } from '@kdcloudjs/shoelace/dist/utilities/base-path.js';

setBasePath(import.meta.env.SHOELACE_BASE_URL);

export default class ExampleComponent extends KingdeeElement {
  @track count = 0;

  logoUrl = 'logo.png';

  handleClick() {
    this.count++;
  }
}
