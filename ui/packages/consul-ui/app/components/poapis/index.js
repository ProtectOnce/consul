/* eslint-disable no-console */

import { action, set } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class Poapis extends Component {
  @tracked apisList = [];
  @tracked apisDataFin = [];

  fetchAuth = () => {
    fetch('https://fe.dev.protectonce.com/frontegg/identity/resources/auth/v1/user', {
      method: 'POST',
      body: JSON.stringify({
        email: 'aditya.j@protectonce.com',
        password: 'Sp@cebound18#d3v',
        recaptchaToken: '',
        invitationToken: '',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((json) => {
        this.getApiRoutes(json?.accessToken);
        // return json?.accessToken;
      });
  };

  getPOAuthToken = () => {
    return this.fetchAuth()
      ?.then((res2) => {
        return res2;
      })
      ?.catch((err) => {
        console.log('err', err);
      });
    // ?.then((res) => {
    //   return res;
    // })
  };

  getApiRoutes = (token) => {
    fetch('https://gql.dev.protectonce.com/graphql', {
      body: '{"query":"query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {\\n  getAPIRoutes(\\n    limit: $limit\\n    nextToken: $nextToken\\n    returnAllRoutes: $returnAllRoutes\\n    query: $query\\n    application_id: $application_id\\n    searchTerm: $searchTerm\\n  )\\n}\\n","variables":{"query":"{\\"bool\\":{\\"must\\":[{\\"match_all\\":{}},{\\"term\\":{\\"api.metadata.appId.keyword\\":\\"PO_2a31cf13-13df-410a-a430-928b0aeaee7c\\"}},{\\"term\\":{\\"api.metadata.workloadId.keyword\\":\\"DEFAULT_WORKLOAD\\"}}]}}","searchTerm":"","returnAllRoutes":true,"nextToken":0,"limit":5000,"application_id":"PO_2a31cf13-13df-410a-a430-928b0aeaee7c"}}',
      method: 'POST',
      headers: {
        authorization: token,
        getapitokenauth: token,
        'content-type': 'application/json',
        'x-api-key': 'da2-7na4grko3bbztfqncpho7x4gfu',
      },
    })
      .then((response) => response.json())
      .then((json) => {
        const apis = JSON.parse(json?.data?.getAPIRoutes);
        this.apisList = apis?.body?.routes;
        return json;
      });
  };

  constructor() {
    super(...arguments);
    // this.getPOAuthToken();
    // this.fetchData();
  }
  getServiceName = (item) => {
    let res = 'Service';

    if (item && item?.resourceSet && item?.resourceSet?.length > 0) {
      for (const resource of item?.resourceSet) {
        const tempName = resource?.resourceName ? resource?.resourceName : 'unknown';
        const tempType = resource?.serviceType;
        if (!tempName) {
          res = 'unknown';
        }
        if (tempName) {
          res = tempName;
        }
        if (tempType === 'lb') {
          res = tempName;
          break;
        }
        if (tempType === 'ecs') {
          res = tempName;
          continue;
        } else if (tempType === 'k8s') {
          res = tempName;
          continue;
        }
      }
    } else if (item && item?.name && item?.name.length > 0) {
      return item?.name;
    } else if (
      item &&
      item?.detail &&
      item?.detail?.request_headers &&
      item?.detail?.request_headers?.Host
    ) {
      const temp = item?.detail?.request_headers?.Host;
      // Regular expression to check if string is a IP address with and without port
      const reg =
        /^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?::(?:[0-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;
      if (temp.match(reg)) {
        return temp;
      }

      //return temp?.split('.')[0];
      return temp?.split(':')[0];
    } else if (item && item?.system_tags && item?.system_tags.length > 0) {
      const temp = item?.system_tags[0]?.name ? item?.system_tags[0]?.name : '';
      if (temp === 'api-gw-route') return 'API Gateway Route';
    } else if (item && item?.workloadName && item?.workloadName !== 'DEFAULT_WORKLOAD') {
      return item?.workloadName;
    } else if (item && item?.workloadName) {
      res = item?.workloadName;
    }
    return res;
  };

  getServiceIconType = (item) => {
    let type = 'api';

    if (item && item?.resourceSet && item?.resourceSet?.length > 0) {
      for (const resource of item?.resourceSet) {
        const tempType = resource?.serviceType;
        if (!tempType) {
          type = 'api';
        }
        if (tempType === 'lb') {
          type = tempType;
          break;
        }
        if (tempType === 'ecs') {
          type = tempType;
        }
        if (tempType === 'ec2') {
          type = tempType;
        }
        if (tempType === 'k8s') {
          type = tempType;
        }
      }
    } else if (item && item?.system_tags && item?.system_tags.length > 0) {
      const temp = item?.system_tags[0]?.name ? item?.system_tags[0]?.name : '';
      if (temp === 'api-gw-route') {
        type = 'api_gw';
      }
    }
    return type;
  };

  sortFunction = (v1, v2) => {
    if (typeof v1 === 'string' && typeof v2 === 'string') {
      v1 = v1.toLocaleLowerCase();
      v2 = v2.toLocaleLowerCase();
    }

    if (v1 > v2) return -1;
    if (v1 < v2) return 1;
    return 0;
  };

  getHost = (item) => {
    let res = '--';
    if (item && item?.detail?.request_headers?.Host) res = item?.detail?.request_headers?.Host;
    if (item && item?.detail?.request_headers?.HOST) res = item?.detail?.request_headers?.HOST;
    return res;
  };

  getPath = (item) => {
    // let res = '--';
    return item?.path ?? '--';
    // if (item && item?.path) res = item?.path;
    // return res;
  };

  getMethod = (item) => {
    let res = '--';
    if (item && item?.method) res = item?.method;
    return res;
  };

  getIssues = (item) => {
    let res = 0;
    if (item && item?.incident_count) res = item?.incident_count;
    return res;
  };

  getPII = (item) => {
    const res = [];
    if (item && item?.piiData) {
      for (const pii in item?.piiData) {
        item?.piiData[pii]?.forEach((val) => {
          if (!res.includes(val?.Type)) res.push(val?.Type);
        });
      }
    }
    return res;
  };

  getAuth = (item) => {
    let res = '--';
    if (item?.detail?.authorization?.hasOwn('isAuthorized')) {
      res = item?.detail?.authorization?.isAuthorized;
    }
    return res;
  };

  getAuthType = (item) => {
    let res = '--';
    if (item && item?.authenticationType) res = item?.authenticationType;
    return res;
  };

  getTrafficValue = (value) => {
    const TRAFFIC_COUNT = {
      LOW: 100,
      MEDIUM: 500,
      HIGH: 500,
    };
    if (value && typeof value === 'number') {
      if (value < TRAFFIC_COUNT.LOW) return 'LOW';
      if (value < TRAFFIC_COUNT.MEDIUM) return 'MEDIUM';
      if (value >= TRAFFIC_COUNT.HIGH) return 'HIGH';
    }
    return 'LOW';
  };

  getDrift = (item) => {
    if (item && item?.specAnalysis && item?.specAnalysis?.driftInfo) {
      if (typeof item?.specAnalysis?.driftInfo?.isDrift === 'boolean') {
        return item?.specAnalysis?.driftInfo?.isDrift;
      }
    }
    return '--';
  };
  getAverageRiskScore = (item) => {
    let res = 'LOW';
    if (item && item?.risk) res = item?.risk;
    return res;
  };

  getValidUrl = (url) => {
    let decodeUrl;
    try {
      decodeUrl = decodeURIComponent(url);
    } catch (err) {
      decodeUrl = url;
    }
    return decodeUrl;
  };
  getStylizedPath = (pathOg) => {
    const path = this.getValidUrl(pathOg);
    if (path) {
      let newPath = path?.split('/');
      if (newPath?.length === 0) {
        return `<span key=${path}>${path}</span>`;
      }
      newPath = newPath?.map((item, index) => {
        if (item[0] === ':') {
          return `<span key=${path + item}>
              <mark>${item}</mark>
              ${index === newPath?.length - 1 ? '' : '/'}
            </span>`;
        }
        return `<span key=${path + item}>
              ${item}
              ${index === newPath?.length - 1 ? '' : '/'}
            </span>`;
      });
      return newPath;
    }
  };

  @action
  handleWillRender(element) {
    var poAuthenticationToken = window.localStorage.getItem('po-authentication-token');

    if (!poAuthenticationToken) {
      // Perform actions before the component renders
      fetch('https://fe.dev.protectonce.com/frontegg/identity/resources/auth/v1/user', {
        method: 'POST',
        body: JSON.stringify({
          email: 'aditya.j@protectonce.com',
          password: 'Sp@cebound18#d3v',
          recaptchaToken: '',
          invitationToken: '',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => response.json())
        .then((json) => {
          console.log();
          window.localStorage.setItem('po-authentication-token', json.accessToken);
          fetch('https://gql.dev.protectonce.com/graphql', {
            body: '{"query":"query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {\\n  getAPIRoutes(\\n    limit: $limit\\n    nextToken: $nextToken\\n    returnAllRoutes: $returnAllRoutes\\n    query: $query\\n    application_id: $application_id\\n    searchTerm: $searchTerm\\n  )\\n}\\n","variables":{"query":"{\\"bool\\":{\\"must\\":[{\\"match_all\\":{}},{\\"term\\":{\\"api.metadata.appId.keyword\\":\\"PO_2a31cf13-13df-410a-a430-928b0aeaee7c\\"}},{\\"term\\":{\\"api.metadata.workloadId.keyword\\":\\"DEFAULT_WORKLOAD\\"}}]}}","searchTerm":"","returnAllRoutes":true,"nextToken":0,"limit":5000,"application_id":"PO_2a31cf13-13df-410a-a430-928b0aeaee7c"}}',
            method: 'POST',
            headers: {
              authorization: json.accessToken,
              getapitokenauth: json.accessToken,
              'content-type': 'application/json',
              'x-api-key': 'da2-7na4grko3bbztfqncpho7x4gfu',
            },
          })
            .then((response) => response.json())
            .then((json) => {
              const apis = JSON.parse(json?.data?.getAPIRoutes);
              this.apisList = apis?.body?.routes;
              const prodat = apis?.body?.routes?.map((item) => ({
                Service: this.getServiceName(item),
                Host: this.getHost(item),
                Path: this.getPath(item),
                Method: this.getMethod(item),
                Risk: this.getAverageRiskScore(item),
                Issues: this.getIssues(item),
                PII: this.getPII(item),
                Auth: this.getAuthType(item),
                Internet:
                  item && typeof item?.internetfacing === 'string'
                    ? item?.internetfacing === 'TRUE'
                      ? true
                      : false
                    : '--',
                Traffic: this.getTrafficValue(item),
                Drifted: this.getDrift(item),
              }));
              set(this, 'apisDataFin', prodat);
              return json;
            });
        });
    } else {
      fetch('https://gql.dev.protectonce.com/graphql', {
        body: '{"query":"query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {\\n  getAPIRoutes(\\n    limit: $limit\\n    nextToken: $nextToken\\n    returnAllRoutes: $returnAllRoutes\\n    query: $query\\n    application_id: $application_id\\n    searchTerm: $searchTerm\\n  )\\n}\\n","variables":{"query":"{\\"bool\\":{\\"must\\":[{\\"match_all\\":{}},{\\"term\\":{\\"api.metadata.appId.keyword\\":\\"PO_2a31cf13-13df-410a-a430-928b0aeaee7c\\"}},{\\"term\\":{\\"api.metadata.workloadId.keyword\\":\\"DEFAULT_WORKLOAD\\"}}]}}","searchTerm":"","returnAllRoutes":true,"nextToken":0,"limit":5000,"application_id":"PO_2a31cf13-13df-410a-a430-928b0aeaee7c"}}',
        method: 'POST',
        headers: {
          authorization: poAuthenticationToken,
          getapitokenauth: poAuthenticationToken,
          'content-type': 'application/json',
          'x-api-key': 'da2-7na4grko3bbztfqncpho7x4gfu',
        },
      })
        .then((response) => response.json())
        .then((json) => {
          const apis = JSON.parse(json?.data?.getAPIRoutes);
          this.apisList = apis?.body?.routes;
          const prodat = apis?.body?.routes?.map((item) => ({
            Service: this.getServiceName(item),
            Host: this.getHost(item),
            Path: this.getPath(item),
            Method: this.getMethod(item),
            Risk: this.getAverageRiskScore(item),
            Issues: this.getIssues(item),
            PII: this.getPII(item),
            Auth: this.getAuthType(item),
            Internet:
              item && typeof item?.internetfacing === 'string'
                ? item?.internetfacing === 'TRUE'
                  ? true
                  : false
                : '--',
            Traffic: this.getTrafficValue(item),
            Drifted: this.getDrift(item),
          }));
          set(this, 'apisDataFin', prodat);
          return json;
        });
    }
  }
}
