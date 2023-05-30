/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';
import { createData } from './poutils';
export default class PoApis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @service router;

  @tracked password = '';
  @tracked email = '';
  @tracked loggedIn = PoBackendAPI.isLoggedIn();
  @tracked isLoaded = 0;
  @tracked error = false;
  @tracked message = '';
  @tracked handleReload = () => {
    this.fetchAllData();
  };

  constructor() {
    super(...arguments);
  }

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

  getUrl = () => {
    let res = '';
    if (window.location?.href) {
      const currentUrl = window.location.href;
      const urlBroken = currentUrl?.split('/');
      const servicesIndex = urlBroken.indexOf('services');
      if (servicesIndex > 0 && servicesIndex + 1 < urlBroken?.length) {
        res = urlBroken[servicesIndex + 1];
      }
    }
    return res;
  };

  renderData = async () => {
    const isLoggedIn = PoBackendAPI.isLoggedIn();
    if (isLoggedIn) {
      set(this, 'isLoaded', 2);
      const url = this.getUrl();
      PoBackendAPI.getAPIRoutes(url)
        ?.then((apisData) => {
          if (apisData && apisData?.data && apisData?.data?.getAPIRoutes) {
            const apis = JSON.parse(apisData?.data?.getAPIRoutes);
            if (apis?.status == 200 && apis?.body && Array.isArray(apis?.body?.routes)) {
              let finalApis = [];
              finalApis = createData(apis?.body?.routes);
              set(this, 'apisDataFin', finalApis);
              set(this, 'isLoaded', 1);
              set(this, 'error', false);
              if (apis?.body?.routes?.length === 0) {
                set(this, 'isLoaded', 0);
                set(this, 'message', 'No data for this application');
                set(this, 'apisDataFin', []);
              }
            } else {
              set(this, 'error', true);
              set(this, 'isLoaded', 1);
              set(this, 'apisDataFin', []);
            }
          }
        })
        ?.catch((err) => {
          set(this, 'isLoaded', 1);
        });
    } else {
      set(this, 'loggedIn', false);
    }
  };

  setWorkloadId = async () => {
    set(this, 'isLoaded', 2);
    const temp = await PoBackendAPI.getApplication();
    if (temp && temp?.data && temp?.data.getApplication) {
      let wok = JSON.parse(temp?.data?.getApplication);
      if (
        wok &&
        wok?.workloadSet &&
        Array.isArray(wok?.workloadSet) &&
        wok?.workloadSet?.length > 0
      ) {
        PoBackendAPI.PO_WORKLOAD_ID = wok?.workloadSet[0]?.workloadId;
      }
    }
    set(this, 'isLoaded', 1);
  };

  fetchAllData = async () => {
    set(this, 'isLoaded', 2);
    await this.setWorkloadId();
    this.renderData();
    set(this, 'isLoaded', 1);
  };

  @action
  async handleWillRender(element) {}

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
