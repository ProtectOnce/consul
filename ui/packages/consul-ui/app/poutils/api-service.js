import ENV from 'consul-ui/config/environment';

class PoBackend {
  FRONTEGG_URL = ENV.POVARS.FRONTEGG_URL;
  // FE_TOKEN = ENV.POVARS.FE_TOKEN;
  AUTH_EMAIL = ''; // ENV.POVARS.AUTH_EMAIL;
  AUTH_PASSWORD = ''; // ENV.POVARS.AUTH_PASSWORD;
  XAPI_KEY = ENV.POVARS.XAPI_KEY;
  GRAPHQL_URL = ENV.POVARS.GRAPHQL_URL;
  PO_APPLICATION_ID = ENV.POVARS.PO_APPLICATION_ID;
  PO_WORKLOAD_ID = ENV.POVARS.PO_WORKLOAD_ID;

  TOKEN_KEYWORD = 'po-authentication-token';
  APIDATA_KEYWORD = 'apiData';

  setEmail(email) {
    if (email !== null && email !== undefined && email !== '') {
      this.AUTH_EMAIL = email;
    }
  }
  setPassword(password) {
    if (password !== null && password !== undefined && password !== '') {
      this.AUTH_PASSWORD = password;
    }
  }

  isLoggedIn = () => {
    let poAuthenticationToken = this.getCookie(this.TOKEN_KEYWORD);
    if (poAuthenticationToken) {
      return true;
    }
    return false;
  };

  poLogout = () => {
    const date = new Date();
    date.setTime();
    const expires = 'expires=' + date.toUTCString(-1);
    `${encodeURIComponent(this.TOKEN_KEYWORD)}=;expires=${expires}; secure`;
  };

  fetchToken = async () => {
    try {
      if (
        this.AUTH_EMAIL &&
        this.AUTH_PASSWORD &&
        this.AUTH_EMAIL !== '' &&
        this.AUTH_PASSWORD !== ''
      ) {
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
      } else {
        return { error: 'Invalid email or password' };
      }
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  setSecureCookie = (cookieName, cookieValue, expirationDays) => {
    if (!cookieName || !cookieValue || !expirationDays) {
      throw new Error('Invalid arguments. Please provide all required parameters.');
    }

    expirationDays = expirationDays || 365;

    const date = new Date();
    date.setTime(date.getTime() + expirationDays * 86400000);
    const expires = 'expires=' + date.toUTCString();
    const secureCookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(
      cookieValue
    )}; ${expires}; secure`;

    try {
      document.cookie = secureCookie;
    } catch (error) {
      throw new Error('Failed to set the secure cookie.');
    }
  };

  getCookie = (cookieName) => {
    if (!cookieName) {
      throw new Error('Invalid argument. Please provide a valid cookie name.');
    }

    const encodedCookieName = encodeURIComponent(cookieName) + '=';
    const cookieArray = document.cookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(encodedCookieName) === 0) {
        const encodedCookieValue = cookie.substring(encodedCookieName.length, cookie.length);
        return decodeURIComponent(encodedCookieValue);
      }
    }

    return null;
  };

  getToken = async () => {
    try {
      let poAuthenticationToken = this.getCookie(this.TOKEN_KEYWORD);
      if (!poAuthenticationToken) {
        const authData = await this.fetchToken();
        if (authData && 'accessToken' in authData) {
          poAuthenticationToken = authData?.accessToken;
          const expirationHours = 24;
          this.setSecureCookie(this.TOKEN_KEYWORD, authData?.accessToken, expirationHours);
        } else {
          console.error("couldn't acquire token");
        }
      }
      return poAuthenticationToken;
    } catch (error) {
      console.error('Error occurred while retrieving the cookie:', error.message);
    }
  };

  getAPIRoutes = async (token) => {
    try {
      // return poapislist;
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

      return response?.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  getPostureIssues = async (token) => {
    try {
      // return postureIssuesList;
      const response = await fetch(this.GRAPHQL_URL, {
        body: JSON.stringify({
          query: `query ($applicationId: String!, $workloadId: String!, $path: String!, $method: String!) {
            getPostureIssuesListForAPI(
              applicationId: $applicationId
              workloadId: $workloadId
              path: $path
              method: $method
            )
          }`,
          variables: {
            applicationId: this.PO_APPLICATION_ID,
            workloadId: this.PO_WORKLOAD_ID,
            path: '/',
            method: 'GET',
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

      return response?.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  saveAPIData = (data) => {
    if (data) {
      window.localStorage.setItem(this.APIDATA_KEYWORD, JSON.stringify(data));
      return true;
    }
    return false;
  };

  getSchemaDetails = async (token, api, method) => {
    const data = window.localStorage.getItem(this.APIDATA_KEYWORD);
    if (data) {
      return data;
    }
    return {};
  };
}

const PoBackendAPI = new PoBackend();

export { PoBackendAPI };
