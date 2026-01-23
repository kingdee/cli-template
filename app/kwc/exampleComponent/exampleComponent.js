import { KingdeeElement, track } from '@kdcloudjs/kwc';

export default class ExampleComponent extends KingdeeElement {
  @track count = 0;

  // Use a getter or simple property. 
  // In dev mode, assets should be copied to dist.
  // We'll assume the logo is available at the root or relative path.
  // If copied to dist root:
  logoUrl = 'logo.png';

  handleClick() {
    this.count++;
  }
}
