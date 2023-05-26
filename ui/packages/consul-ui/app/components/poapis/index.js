/* eslint-disable no-console */

import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import ENV from 'consul-ui/config/environment';
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
  getTrafficValue,
} from './utils';

import { PoBackendAPI } from '../../poutils/api-service';
export default class SchemaDetails extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked dataIsLoaded = false;
  @service router;


  GRAPHQL_URL = ENV.POVARS.GRAPHQL_URL;
  PO_APPLICATION_ID = ENV.POVARS.PO_APPLICATION_ID;
  PO_WORKLOAD_ID = ENV.POVARS.PO_WORKLOAD_ID;
  REST_IMAGE_URI = '/ui/assets/images/apiTypes/rest.svg';
  GRPC_IMAGE_URI = '/ui/assets/images/apiTypes/grpc.svg';

  
  constructor() {
    super(...arguments);
  }

  createData = (apis) => {
    if (apis && apis?.length > 0) {
      return apis?.map((item) => ({
        Service: 'Shopping Cart Service', // getServiceName(item),
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

  @action
  async handleWillRender(element) {
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
    }
  }

  @action
  showDetails(event) {
    const saved = PoBackendAPI.saveAPIData({
      name: event?.Path,
      method: event?.Method,
      schemaData: event?.schemaData,
    });
    if (saved) {
      const params = { p: event?.Path, m: event?.Method };
      this.router.transitionTo('dc.api.schema', btoa(JSON.stringify(params)));
    }
  }
}
