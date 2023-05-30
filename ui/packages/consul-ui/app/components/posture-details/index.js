/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';

export default class PostureDetails extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked showModal = false;
  @tracked selectedPosture = {};

  @tracked error = false;

  @service router;

  @action
  async handleWillRender(element) {
    const isLoggedIn = PoBackendAPI.isLoggedIn();
    if (isLoggedIn) {
      set(this, 'isLoaded', false);
      PoBackendAPI.getPostureIssues()
        ?.then((apisData) => {
          if (apisData && apisData?.data) {
            if (apisData?.data?.getPostureIssuesListForAPI !== null) {
              const postureIssues = JSON.parse(apisData?.data?.getPostureIssuesListForAPI);
              if (postureIssues) {
                set(this, 'error', false);
                set(this, 'postureIssues', postureIssues);
              }
            } else if (apisData?.data?.getPostureIssuesListForAPI === null) {
              set(this, 'postureIssues', []);
              set(this, 'message', 'No Posture Issues found for this API.');
              set(this, 'postureIssues', []);
            } else {
              set(this, 'postureIssues', []);
              set(this, 'error', true);
            }
            set(this, 'isLoaded', true);
          }
        })
        ?.catch((err) => {
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
