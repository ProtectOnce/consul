/* eslint-disable no-console */

import { action, set } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  getAuthType,
  getAverageRiskScore,
  getDrift,
  getHost,
  getIssues,
  getMethod,
  getPII,
  getPath,
  getTrafficValue,
} from './utils';
import ENV from 'consul-ui/config/environment';
export default class Poapis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked dataIsLoaded = false;

  FRONTEGG_URL = ENV.POVARS.FRONTEGG_URL;
  GRAPHQL_URL = ENV.POVARS.GRAPHQL_URL;
  AUTH_EMAIL = ENV.POVARS.AUTH_EMAIL;
  AUTH_PASSWORD = ENV.POVARS.AUTH_PASSWORD;
  PO_APPLICATION_ID = ENV.POVARS.PO_APPLICATION_ID;
  XAPI_KEY = ENV.POVARS.XAPI_KEY;
  PO_WORKLOAD_ID = ENV.POVARS.PO_WORKLOAD_ID;
  TOKEN_KEYWORD = 'po-authentication-token';
  REST_IMAGE_URI = '/ui/assets/images/apiTypes/rest.svg';
  GRPC_IMAGE_URI = '/ui/assets/images/apiTypes/grpc.svg';
  constructor() {
    super(...arguments);
  }

  fetchToken = async () => {
    try {
      const response = await fetch(this.FRONTEGG_URL, {
        method: 'POST',
        body: JSON.stringify({
          email: this.AUTH_EMAIL,
          password: this.AUTH_PASSWORD,
          recaptchaToken: '',
          invitationToken: '',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      return await response?.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  getToken = async () => {
    let poAuthenticationToken = window.localStorage.getItem(this.TOKEN_KEYWORD);

    if (!poAuthenticationToken) {
      const authData = await this.fetchToken();
      console.log(authData);
      if (authData && 'accessToken' in authData) {
        poAuthenticationToken = authData?.accessToken;
        window.localStorage.setItem(this.TOKEN_KEYWORD, authData?.accessToken);
      } else {
        console.error("couldn't acquire token");
      }
    }
    return poAuthenticationToken;
  };

  getApiRoutes = async (token) => {
    try {
      const response = await fetch(this.GRAPHQL_URL, {
        body: JSON.stringify({
          query: `query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {
              getAPIRoutes(limit: $limit, nextToken: $nextToken, returnAllRoutes: $returnAllRoutes, query: $query, application_id: $application_id, searchTerm: $searchTerm)
            }`,
          variables: {
            query: JSON.stringify({
              bool: {
                must: [
                  {
                    match_all: {},
                  },
                  {
                    term: {
                      'api.metadata.appId.keyword': this.PO_APPLICATION_ID,
                    },
                  },
                  {
                    term: {
                      'api.metadata.workloadId.keyword': this.PO_WORKLOAD_ID,
                    },
                  },
                ],
              },
            }),
            searchTerm: '',
            returnAllRoutes: true,
            nextToken: 0,
            limit: 5000,
            application_id: this.PO_APPLICATION_ID,
          },
        }),
        method: 'POST',
        headers: {
          authorization: token,
          getapitokenauth: token,
          'content-type': 'application/json',
          'x-api-key': this.XAPI_KEY,
        },
      });
      // fetch(this.GRAPHQL_URL, {
      //   body: '{"query":"query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {\\n  getAPIRoutes(\\n    limit: $limit\\n    nextToken: $nextToken\\n    returnAllRoutes: $returnAllRoutes\\n    query: $query\\n    application_id: $application_id\\n    searchTerm: $searchTerm\\n  )\\n}\\n","variables":{"query":"{\\"bool\\":{\\"must\\":[{\\"match_all\\":{}},{\\"term\\":{\\"api.metadata.appId.keyword\\":\\"PO_2a31cf13-13df-410a-a430-928b0aeaee7c\\"}},{\\"term\\":{\\"api.metadata.workloadId.keyword\\":\\"DEFAULT_WORKLOAD\\"}}]}}","searchTerm":"","returnAllRoutes":true,"nextToken":0,"limit":5000,"application_id":"PO_2a31cf13-13df-410a-a430-928b0aeaee7c"}}',
      //   method: 'POST',
      //   headers: {
      //     authorization: token,
      //     getapitokenauth: token,
      //     'content-type': 'application/json',
      //     'x-api-key': this.XAPI_KEY,
      //   },
      // });

      return await response.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

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
      }));
    }
    return [];
  };

  @action
  async handleWillRender(element) {
    const token = await this.getToken();
    if (token) {
      this.getApiRoutes(token)
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
}
