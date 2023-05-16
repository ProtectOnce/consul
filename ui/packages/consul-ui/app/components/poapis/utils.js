export const getServiceName = (item) => {
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

export const getServiceIconType = (item) => {
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

export const sortFunction = (v1, v2) => {
  if (typeof v1 === 'string' && typeof v2 === 'string') {
    v1 = v1.toLocaleLowerCase();
    v2 = v2.toLocaleLowerCase();
  }

  if (v1 > v2) return -1;
  if (v1 < v2) return 1;
  return 0;
};

export const getHost = (item) => {
  let res = '--';
  if (item && item?.detail?.request_headers?.Host) res = item?.detail?.request_headers?.Host;
  if (item && item?.detail?.request_headers?.HOST) res = item?.detail?.request_headers?.HOST;
  return res;
};

export const getPath = (item) => {
  // let res = '--';
  return item?.path ?? '--';
  // if (item && item?.path) res = item?.path;
  // return res;
};

export const getMethod = (item) => {
  let res = '--';
  if (item && item?.method) res = item?.method;
  return res;
};

export const getIssues = (item) => {
  let res = 0;
  if (item && item?.incident_count) res = item?.incident_count;
  return res;
};

export const getPII = (item) => {
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

export const getAuth = (item) => {
  let res = '--';
  if (item?.detail?.authorization?.hasOwn('isAuthorized')) {
    res = item?.detail?.authorization?.isAuthorized;
  }
  return res;
};

export const getAuthType = (item) => {
  let res = '--';
  if (item && item?.authenticationType) res = item?.authenticationType;
  return res;
};

export const getTrafficValue = (value) => {
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

export const getDrift = (item) => {
  if (item && item?.specAnalysis && item?.specAnalysis?.driftInfo) {
    if (typeof item?.specAnalysis?.driftInfo?.isDrift === 'boolean') {
      return item?.specAnalysis?.driftInfo?.isDrift;
    }
  }
  return '--';
};
export const getAverageRiskScore = (item) => {
  let res = 'LOW';
  if (item && item?.risk) res = item?.risk;
  return res;
};

export const getValidUrl = (url) => {
  let decodeUrl;
  try {
    decodeUrl = decodeURIComponent(url);
  } catch (err) {
    decodeUrl = url;
  }
  return decodeUrl;
};

export const getStylizedPath = (pathOg) => {
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
