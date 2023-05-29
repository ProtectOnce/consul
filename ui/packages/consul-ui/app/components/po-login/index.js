/* eslint-disable no-console */

import { action, set } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';
export default class PoLogin extends Component {
  @tracked password = '';
  @tracked email = '';
  @tracked loggedIn = false;
  @tracked error = false;

  constructor() {
    super(...arguments);
  }

  @action
  async handleWillRender(element) {
    if (PoBackendAPI.isLoggedIn()) {
      console.log('logged in');
      this.loggedIn = true;
      const token = await PoBackendAPI.getToken();
      if (token) {
        PoBackendAPI.getAPIRoutes(token)
          ?.then((apisData) => {
            if (apisData && apisData?.data && apisData?.data?.getAPIRoutes) {
              const apis = JSON.parse(apisData?.data?.getAPIRoutes);
              if (apis && apis?.body && apis?.body?.routes && Array.isArray(apis?.body?.routes)) {
                const finalApis = this.createData(apis?.body?.routes);
                set(this, 'apisDataFin', finalApis);
                set(this, 'isLoaded', true);
              }
            }
          })
          ?.catch((err) => {
            console.error(err);
            set(this, 'isLoaded', true);
          });
        set(this, 'loggedIn', true);
      } else {
        set(this, 'loggedIn', false);
      }
    } else {
      this.loggedIn = false;
    }
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
