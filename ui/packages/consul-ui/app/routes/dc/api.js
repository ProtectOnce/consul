import Route from '@ember/routing/route';
import { PoBackendAPI } from '../../poutils/api-service';

export default class ApiRoute extends Route {
  model() {
    const data = window.localStorage.getItem(PoBackendAPI.APIDATA_KEYWORD);
    if (data) {
      const temp = JSON.parse(data);
      //   set(this, 'data', { name: temp.name, method: temp.method });
      return { name: temp.name, method: temp.method, backTo: temp.backTo, linkTo: temp?.linkTo };
    }
  }
}
