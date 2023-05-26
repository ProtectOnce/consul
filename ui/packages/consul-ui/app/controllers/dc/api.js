import Controller from '@ember/controller';
import { PoBackendAPI } from '../../poutils/api-service';

import { set } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ApiController extends Controller {
  @tracked data;
  constructor() {
    super();
    const data = window.localStorage.getItem(PoBackendAPI.APIDATA_KEYWORD);
    if (data) {
      const temp = JSON.parse(data);
      set(this, 'data', { name: temp.name, method: temp.method });
    }
  }
}
