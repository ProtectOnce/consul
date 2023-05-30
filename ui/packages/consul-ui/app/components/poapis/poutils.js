export const getServiceName = (item) => {
  let res = 'Service';
  const serviceType = getServiceIconType(item);
  if (serviceType === 'consulNode') {
    if (item?.service && Array.isArray(item.service) && item?.service?.length > 0) {
      return item?.service[0]?.displayName?.replace('service-', '');
    }
  }

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
      if (tempType === 'consulNode') {
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

export const getSchemaData = (item) => {
  let statusCodes = [];
  let showStatusCodeSelection = false;
  let selectedStatusCode = '200';
  let transformedData = [];

  const doKeys = Object?.keys(item?.detail);
  let multObj = false;
  const oldKeys = [
    'authorization',
    'query_params',
    'path_params',
    'request_body_schema',
    'response_body_schema',
    'response_headers',
    'request_headers',
  ];
  if (doKeys?.length === 0) {
    return [];
  }

  const commonElements = doKeys?.filter((value) => oldKeys?.includes(value));
  if (commonElements?.length === 0) {
    statusCodes = doKeys;
    // setSelectedStatusCodes([doKeys[0]]);
    showStatusCodeSelection = true;
    multObj = true;
  } else {
    showStatusCodeSelection = false;
  }

  const flattenObject = (obj) => {
    const result = [];

    const flatten = (obj, parentKey = '') => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          let propName = parentKey ? `${parentKey}.${key}` : key;
          if (key === 'isAuthorized') {
            continue;
          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flatten(value, propName);
          } else {
            const type = Array.isArray(value) ? 'array' : typeof value;
            result.push({ name: propName, value: value, type: type });
          }
        }
      }
    };

    flatten(obj);
    return result;
  };

  const handleSchemaGeneration = (input) => {
    delete input?.response_body_schema;
    const flattenedData = flattenObject(input);
    return flattenedData;
  };

  const transformData = ({ schemaData }) => {
    let res = {};
    const doKeys = Object?.keys(item?.detail);
    let multObj = false;
    const oldKeys = [
      'authorization',
      'query_params',
      'path_params',
      'request_body_schema',
      'response_body_schema',
      'response_headers',
      'request_headers',
    ];
    if (doKeys?.length === 0) {
      multObj = false;
    }

    const commonElements = doKeys?.filter((value) => oldKeys?.includes(value));
    if (commonElements?.length === 0) {
      multObj = true;
    }

    showStatusCodeSelection = multObj;
    if (multObj) {
      doKeys?.forEach((value) => {
        const intmVal = schemaData[value]?.schema;
        res[value] = handleSchemaGeneration(intmVal);
      });
    } else {
      res['200'] = handleSchemaGeneration(schemaData);
    }
    selectedStatusCode = multObj ? (doKeys?.length > 0 ? doKeys[0] : '200') : '200';
    transformedData = res;
  };

  transformData({
    schemaData: item?.detail,
    statusCodes,
    showStatusCodeSelection,
    selectedStatusCode,
    transformedData,
  });

  if (!multObj) {
    selectedStatusCode = '200';
    showStatusCodeSelection = false;
  }
  transformData[selectedStatusCode];

  return transformedData;
};

export const getApiType = (item) => {
  const type = {
    REST: 'REST',
    HTTP: 'REST',
    HTTPS: 'REST',
    GRPC: 'GRPC',
    default: 'REST',
    PROTOBUF: 'GRPC',
  };

  if (item && item?.protocol) {
    return type[item?.protocol?.toUpperCase() || 'REST'];
  }

  return 'REST';
};

export const createData = (apis) => {
  const res = [];

  const IMAGES = {
    REST: '/ui/assets/images/apiTypes/rest.svg',
    GRPC: '/ui/assets/images/apiTypes/grpc.svg',
  };

  if (apis && apis?.length > 0) {
    apis?.forEach((item) => {
      res?.push({
        Service: getServiceName(item),
        APIType: getApiType(item),
        APIImage: IMAGES[getApiType(item)],
        // Host: getHost(item),
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
      });
    });
  }
  return res;
};
