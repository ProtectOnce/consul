/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';
import {
  getAuthType,
  getAverageRiskScore,
  getDrift,
  getHost,
  getIssues,
  getMethod,
  getPII,
  getPath,
  getSchemaData,
  getServiceName,
  getTrafficValue,
} from './poutils';
export default class PoApis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked dataIsLoaded = false;
  @service router;

  @tracked password = '';
  @tracked email = '';
  @tracked loggedIn = this.checkLoggedIn();
  @tracked error = false;

  REST_IMAGE_URI = '/ui/assets/images/apiTypes/rest.svg';
  GRPC_IMAGE_URI = '/ui/assets/images/apiTypes/grpc.svg';

  constructor() {
    super(...arguments);
  }

  checkLoggedIn = () => {
    const areYou = PoBackendAPI.isLoggedIn();
    console.log('logged in, ', areYou);
    return areYou;
  };

  createData = (apis) => {
    if (apis && apis?.length > 0) {
      return apis?.map((item) => ({
        Service: getServiceName(item),
        APIType: item?.method?.toUpperCase() === 'POST' ? 'REST' : 'gRPC',
        APIImage:
          item?.method?.toUpperCase() === 'POST' ? this.REST_IMAGE_URI : this.GRPC_IMAGE_URI,
        Host: getHost(item),
        Path: getPath(item),
        Method: getMethod(item),
        Risk: getAverageRiskScore(item),
        Issues: getIssues(item),
        PII: getPII(item),
        Auth: getAuthType(item),
        Internet:
          item && typeof item?.internetfacing === 'string'
            ? item?.internetfacing === 'TRUE'
              ? true
              : false
            : '--',
        Traffic: getTrafficValue(item),
        Drifted: getDrift(item),
        schemaData: getSchemaData(item),
      }));
    }
    return [];
  };

  verifyValue(event) {
    if (
      event !== null &&
      event !== undefined &&
      event?.target &&
      event?.target?.value &&
      event?.target?.value !== null &&
      event?.target?.value !== undefined &&
      event?.target.value !== '' &&
      event?.target?.value?.length > 3
    ) {
      return true;
    }
    return false;
  }

  renderData = async () => {
    const token = await PoBackendAPI.getToken();
    if (token) {
      PoBackendAPI.getAPIRoutes(token)
        ?.then((apisData) => {
          if (apisData && apisData?.data && apisData?.data?.getAPIRoutes) {
            const apis = JSON.parse(apisData?.data?.getAPIRoutes);
            if (apis?.status == 200) {
              if (apis && apis?.body && apis?.body?.routes && Array.isArray(apis?.body?.routes)) {
                const finalApis = this.createData(apis?.body?.routes);
                set(this, 'apisDataFin', finalApis);
                set(this, 'isLoaded', true);
                set(this, 'error', false);
              }
            } else {
              set(this, 'error', true);
              set(this, 'isLoaded', true);
              set(this, 'apisDataFin', []);
            }
          }
        })
        ?.catch((err) => {
          set(this, 'isLoaded', true);
        });
    } else {
      set(this, 'loggedIn', false);
    }
  };

  @action
  async handleWillRender(element) {
    if (this.loggedIn) {
      this.renderData();
    }
  }

  @action
  showDetails(event) {
    const url = window?.location?.pathname;
    const saved = PoBackendAPI.saveAPIData({
      name: event?.Path,
      method: event?.Method,
      schemaData: event?.schemaData,
      linkTo: url,
    });
    if (saved) {
      const params = { p: event?.Path, m: event?.Method };
      this.router.transitionTo('dc.api.schema', btoa(JSON.stringify(params)));
    }
  }

  @action
  showLoginModal() {
    set(this, 'openLogin', true);
  }

  @action
  closeModal() {
    set(this, 'openLogin', false);
    this.email = '';
    this.password = '';
  }

  @action
  signUp() {
    const url = 'https://dev.protectonce.com/';
    window.open(url, '_blank');
  }

  @action
  async initiateLogin() {
    if (this.email && this.password) {
      PoBackendAPI.setEmail(this.email);
      PoBackendAPI.setPassword(this.password);
      const data = await PoBackendAPI.getToken();
      if (data !== null && data !== undefined && data !== '') {
        this.loggedIn = true;
        set(this, 'loggedIn', true);
        set(this, 'openLogin', false);
        this.renderData();
      }
    }
  }

  @action
  setEmail(event) {
    if (this.verifyValue(event)) {
      this.email = event?.target?.value;
    }
  }

  @action
  setPassword(event) {
    if (this.verifyValue(event)) {
      this.password = event?.target?.value;
    }
  }
}
