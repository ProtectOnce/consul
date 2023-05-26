/* eslint-env node */

'use strict';

const path = require('path');

module.exports = function (/* env */) {
  return {
    clientAllowedKeys: [
      'FRONTEGG_URL',
      'GRAPHQL_URL',
      'AUTH_EMAIL',
      'AUTH_PASSWORD',
      'PO_APPLICATION_ID',
      'XAPI_KEY',
      'PO_WORKLOAD_ID',
    ],
    fastbootAllowedKeys: [],
    failOnMissingKey: false,
    path: path.join(path.dirname(__dirname), '.env'),
  };
};
