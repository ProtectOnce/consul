module.exports = function (env) {
  return {
    clientAllowedKeys: ['PO_LOGIN_EMAIL'],
    path: `./path/to/.env-${env}`,
  };
};
