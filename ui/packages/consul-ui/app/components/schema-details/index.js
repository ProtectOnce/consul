/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { PoBackendAPI } from '../../poutils/api-service';
export default class Poapis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @service router;
  @tracked selectedStatusCode = '200';
  @tracked schemaData = [];
  @tracked showSelector = false;
  @tracked activeTab = 'request';

  globalSchemaData = {};

  @action
  async handleWillRender(element) {
    set(this, 'isLoaded', false);
    PoBackendAPI.getSchemaDetails()
      ?.then((data) => {
        if (data) {
          let finalData = JSON.parse(data);
          if (Object.prototype.hasOwnProperty.call(finalData, 'schemaData')) {
            const stCodes = Object.keys(finalData?.schemaData);
            this.globalSchemaData = finalData?.schemaData;
            this.selectedStatusCode = stCodes[0];
            this.setTableColumns('request');

            set(this, 'statusCodes', stCodes);
            set(this, 'showSelector', stCodes?.length > 1);
            set(this, 'selectedStatusCode', stCodes[0]);
          }
        }
        set(this, 'isLoaded', true);
      })
      ?.catch((err) => {
        console.error(err);
        set(this, 'isLoaded', true);
      });
  }

  @action
  selectCode(event) {
    if (event && event !== '') {
      set(this, 'selectedStatusCode', event);
      this.setTableColumns(this.activeTab);
    }
  }

  @action
  setTableColumns(event) {
    if (event) {
      const temp = {
        request: [],
        response: [],
      };

      const renameItem = (item, zeroKeyword = '$') => {
        const nem = item?.name?.split('.');
        nem[0] = zeroKeyword;
        item['name'] = nem?.join('.');
      };

      this.globalSchemaData[this.selectedStatusCode]?.forEach((ogItem) => {
        const item = structuredClone(ogItem);
        if (
          item?.name?.includes('request_headers') ||
          item?.name?.includes('request_body_schema')
        ) {
          renameItem(item);
          temp['request']?.push(item);
        } else if (item?.name?.includes('response_headers')) {
          renameItem(item);
          temp['response']?.push(item);
        } else {
          temp['request']?.push(item);
        }
      });
      this.activeTab = event;
      set(this, 'activeTab', event);
      set(this, 'schemaData', temp[event]);
    }
  }
}
