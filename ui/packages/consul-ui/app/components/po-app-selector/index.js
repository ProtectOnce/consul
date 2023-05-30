/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';
export default class Poapis extends Component {
  @service router;
  @tracked selectedApp = {
    application_name: 'Select Application',
    application_id: '',
  };
  @tracked applications = [];
  globalAppData = {};

  @action
  async handleWillRender() {
    set(this, 'isLoaded', false);
    PoBackendAPI.getTenant()
      ?.then((data) => {
        if (data && data?.data && data?.data?.getTenant) {
          const res = JSON.parse(data?.data?.getTenant);
          if (res && res?.applications && Array.isArray(res?.applications)) {
            set(this, 'applications', res?.applications);
            set(this, 'selectedApp', res?.applications[0]);
            PoBackendAPI.setApplicationId(res?.applications[0]?.application_ids[0]?.application_id);
            this.args.handleReload();
          }
          set(this, 'isLoaded', true);
        }
      })
      ?.catch((err) => {
        console.error(err);
        set(this, 'isLoaded', true);
      });
  }

  @action
  selectApp(event) {
    if (event && event !== '') {
      const temp = {
        application_name: event?.application_name,
        application_id: event?.application_ids[0]?.application_id,
      };
      PoBackendAPI.setApplicationId(event?.application_ids[0]?.application_id);
      set(this, 'selectedApp', temp);
      // set(this, 'reload', 'hahhhh');
      this.args.handleReload();
    }
  }
}
