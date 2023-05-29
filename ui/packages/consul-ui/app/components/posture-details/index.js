/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';

export default class PostureDetails extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked dataIsLoaded = false;
  @tracked showModal = false;
  @tracked selectedPosture = {};

  @service router;

  @action
  async handleWillRender(element) {
    const isLoggedIn = PoBackendAPI.isLoggedIn();
    if (isLoggedIn) {
      PoBackendAPI.getPostureIssues()
        ?.then((apisData) => {
          if (apisData && apisData?.data && apisData?.data?.getPostureIssuesListForAPI) {
            const postureIssues = JSON.parse(apisData?.data?.getPostureIssuesListForAPI);
            if (postureIssues && Array.isArray(postureIssues)) {
              set(this, 'postureIssues', postureIssues);
              set(this, 'isLoaded', true);
            }
          }
        })
        ?.catch((err) => {
          console.error(err);
          set(this, 'isLoaded', true);
        });
    }
  }

  @action
  showPostureDetails(event) {
    set(this, 'showModal', true);
    set(this, 'selectedPosture', event);
  }

  @action
  hideModal() {
    set(this, 'showModal', false);
  }
}
