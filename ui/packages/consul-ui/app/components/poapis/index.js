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
  getServiceName,
  getTrafficValue,
} from './utils';

export default class Poapis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];
  @tracked dataIsLoaded = false;

  FRONTEGG_URL = 'https://fe.staging.protectonce.com/frontegg/identity/resources/auth/v1/user';
  GRAPHQL_URL = 'https://gql.staging.protectonce.com/graphql';
  AUTH_EMAIL = 'aditya.j@protectonce.com';
  AUTH_PASSWORD = 'Sp@cebound18#s$tg';
  PO_APPLICATION_ID = 'PO_4d29a1c1-02cf-4614-b7df-7c2b38bab429';
  TOKEN_KEYWORD = 'po-authentication-token';
  XAPI_KEY = 'da2-tvafhllleveedme3ic5kmfv3za';
  PO_WORKLOAD_ID = 'DEFAULT_WORKLOAD';

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
      return await response.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  getToken = async () => {
    let poAuthenticationToken = window.localStorage.getItem(this.TOKEN_KEYWORD);

    if (!poAuthenticationToken) {
      const authData = await this.fetchToken();
      console.log('forced to fetch token ');
      poAuthenticationToken = authData?.accessToken;
      window.localStorage.setItem(this.TOKEN_KEYWORD, authData?.accessToken);
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
        Service: getServiceName(item),
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
    this.getApiRoutes(token)
      ?.then((apisData) => {
        if (apisData && apisData?.data && apisData?.data?.getAPIRoutes) {
          const apis = JSON.parse(apisData?.data?.getAPIRoutes);
          if (apis && apis?.body && apis?.body?.routes && Array.isArray(apis?.body?.routes)) {
            const finalApis = this.createData(apis?.body?.routes);
            set(this, 'apisDataFin', finalApis);
            set(this, 'isLoaded', true);
            console.log(finalApis);
          }
        }
      })
      ?.catch((err) => {
        console.error(err);
        set(this, 'isLoaded', true);
      });
  }
}
