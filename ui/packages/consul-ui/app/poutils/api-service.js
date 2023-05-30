import ENV from 'consul-ui/config/environment';

class PoBackend {
  FRONTEGG_URL = ENV.POVARS.FRONTEGG_URL;
  XAPI_KEY = ENV.POVARS.XAPI_KEY;
  GRAPHQL_URL = ENV.POVARS.GRAPHQL_URL;

  // FE_TOKEN = ENV.POVARS.FE_TOKEN;
  AUTH_EMAIL = ''; // ENV.POVARS.AUTH_EMAIL;
  AUTH_PASSWORD = ''; // ENV.POVARS.AUTH_PASSWORD;
  PO_APPLICATION_ID = '';
  PO_WORKLOAD_ID = ''; //ENV.POVARS.PO_WORKLOAD_ID;

  TOKEN_KEYWORD = 'po-authentication-token';
  APIDATA_KEYWORD = 'apiData';
  ID_KEYWORD = 'user_id';

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
  setApplicationId(applicationId) {
    if (applicationId !== null && applicationId !== undefined && applicationId !== '') {
      this.PO_APPLICATION_ID = applicationId;
    }
  }

  setWorkloadId(workloadId) {
    if (workloadId !== null && workloadId !== undefined && workloadId !== '') {
      this.PO_WORKLOAD_ID = workloadId;
    }
  }

  isLoggedIn = () => {
    let poAuthenticationToken = this.getCookie(this.TOKEN_KEYWORD);
    if (poAuthenticationToken) {
      return true;
    }
    return false;
  };

  fetchToken = async () => {
    try {
      if (
        this.AUTH_EMAIL &&
        this.AUTH_PASSWORD &&
        this.AUTH_EMAIL !== '' &&
        this.AUTH_PASSWORD !== ''
      ) {
        const response = await fetch(`${this.FRONTEGG_URL}/auth/v1/user`, {
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

  setSecureCookie = (cookieName, cookieValue, expirationHours) => {
    if (!cookieName || !cookieValue || !expirationHours) {
      throw new Error('Invalid arguments. Please provide all required parameters.');
    }

    expirationHours = expirationHours || 365;

    const date = new Date();
    date.setTime(date.getTime() + expirationHours * 3600000);
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
          const expirationHours = 23;
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

  fetchTenantId = async () => {
    try {
      const token = this.getCookie(this.TOKEN_KEYWORD);
      let response = await fetch(`${this.FRONTEGG_URL}/users/v2/me`, {
        headers: { 'Content-Type': 'application/json', authorization: token },
      });
      response = await response?.json();
      return response?.tenantId;
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  getAPIRoutes = async (input = '') => {
    try {
      // return poapislist;
      const token = this.getCookie(this.TOKEN_KEYWORD);

      const mustList = [
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
      ];
      if (typeof input === 'string' && input !== '') {
        mustList?.push({
          terms: {
            'api.route.service.displayName.keyword': [`service-${input}`],
          },
        });
      }
      const response = await fetch(this.GRAPHQL_URL, {
        body: JSON.stringify({
          query: `query ($limit: Int, $nextToken: Int, $returnAllRoutes: Boolean, $query: String!, $application_id: String, $searchTerm: String) {
              getAPIRoutes(limit: $limit, nextToken: $nextToken, returnAllRoutes: $returnAllRoutes, query: $query, application_id: $application_id, searchTerm: $searchTerm)
            }`,
          variables: {
            query: JSON.stringify({
              bool: {
                must: mustList,
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

  getPostureIssues = async () => {
    try {
      // return postureIssuesList;
      const token = this.getCookie(this.TOKEN_KEYWORD);
      const apiData = this.getAPIdata();
      if ('name' in apiData && 'method' in apiData) {
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
              path: apiData?.name,
              method: apiData?.method,
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
      }
      return {};
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

  getAPIdata = () => {
    const data = window.localStorage.getItem(this.APIDATA_KEYWORD);
    if (data && data !== null) {
      return JSON.parse(data);
    }
    return [];
  };

  getSchemaDetails = async (token, api, method) => {
    const data = window.localStorage.getItem(this.APIDATA_KEYWORD);
    if (data) {
      return data;
    }
    return {};
  };

  getTenant = async () => {
    try {
      const token = this.getCookie(this.TOKEN_KEYWORD);
      const tenantId = await this.fetchTenantId();

      const response = await fetch(this.GRAPHQL_URL, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',

          authorization: token,
          getapitokenauth: token,
        },
        body: JSON.stringify({
          query: `query ($id: String!) { getTenant(id: $id) }`,
          variables: {
            id: tenantId,
          },
        }),
        method: 'POST',
      });
      return response.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  getApplication = async () => {
    try {
      const token = this.getCookie(this.TOKEN_KEYWORD);
      if (this.PO_APPLICATION_ID && this.PO_APPLICATION_ID === '') {
        return {};
      }
      const response = await fetch(this.GRAPHQL_URL, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',

          authorization: token,
          getapitokenauth: token,
        },
        body: JSON.stringify({
          query: `query ($id: String!) { getApplication(application_id: $id) }`,
          variables: {
            id: this.PO_APPLICATION_ID,
          },
        }),
        method: 'POST',
      });
      return response.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  };
}

const PoBackendAPI = new PoBackend();

export { PoBackendAPI };

// fetch("https://gql.dev.protectonce.com/graphql", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "authorization": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImMyMGM4ZTFkIn0.eyJzdWIiOiI5OWE3ODNjNy0yNGVjLTQ5MDktYTIyMC02MWEwNzY5YjRjNGUiLCJuYW1lIjoiQWRpdHlhIEphaXN3YWwiLCJlbWFpbCI6ImFkaXR5YS5qQHByb3RlY3RvbmNlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJtZXRhZGF0YSI6e30sInJvbGVzIjpbXSwicGVybWlzc2lvbnMiOltdLCJ0ZW5hbnRJZCI6IjU4NWRjYzRjLTBjZGMtNDkxNC04OTYyLTQ5Yjg1ZTI0MDJhNCIsInRlbmFudElkcyI6WyJkYjA5Y2YzNi0zOTdmLTQ2ZGMtOTE1ZC0xODc0ZTk3NTE4MzIiLCIxNmU4NzQ0MC1mYmU5LTRiZWUtYmE1Yy0yNzk2MzdmODY0YTYiLCI1ODVkY2M0Yy0wY2RjLTQ5MTQtODk2Mi00OWI4NWUyNDAyYTQiLCJjMzZhNTUyNS0yNGFkLTRlNmYtYjg4ZC00NzNiZmM5ZGY5YzAiLCI3NWU2YTUzZS0wYmRjLTRmM2MtYmVhMC03OTRjMjljOGQzY2EiLCI4MDA1MmFkZS04NGFkLTQ2NWYtYTc3Yi00NGM1ODliOTk2M2IiLCIyMmE0ODEyMi1iM2RkLTQ3NjItYmIwZC04MmEwMWE3YTI5YTciLCJlYzc5ODg0Ny1hZWY5LTQ0YWMtOTUxYS02MTg0Njc1NmY0MmUiLCJkNDFmZjU4YS0wMDgzLTRlOTItOGEzNS0zNWZhMGYwN2YxMTUiLCIxMmJhZmRmZC1kNDgxLTRmMzQtOGQ1YS0wNGFmZDcyYWNiZTYiXSwicHJvZmlsZVBpY3R1cmVVcmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BTG01d3UyMVFsVW1DUXRIdWtKNFBLaHl1cVlsdFZaWFRIbGl1anNUSzFGVT1zOTYtYyIsInNpZCI6ImQ2YmM4MzVlLWIyZTUtNGFlNS04ZTJkLWFkOGY5MWEwZjBkMyIsInR5cGUiOiJ1c2VyVG9rZW4iLCJhdWQiOiJjMjBjOGUxZC05YmM4LTQ2N2ItYjljOC0xYzdlMDdjNTJmNzMiLCJpc3MiOiJodHRwczovL2ZlLmRldi5wcm90ZWN0b25jZS5jb20iLCJpYXQiOjE2ODUzNjY5NjcsImV4cCI6MTY4NTQ1MzM2N30.Saa9CKdDXCKmZjHE3WqWYIAuRhDzP_FkrDwhGDDhce6RX5INp5FcRQYhR6dmzwYm7rRGNYdHO56pqpfHCMMVNU7JCZ2ySkbctLoPs9xKPIHA6QxUon-Ya83uN9HLqpU9ey5AfAJNe8WodouePv1Q8rc9CuB2KCjdvrnDc-k29nLQdc_Evw4YY1L56ZMkfPIX8dMTNKOm4qxR65uKkYNAliLc-xoo5_6IKmuTyXfMziE855NBvVooCHuOVwZt_9wzBoiwW7gpGKG32LQStaFAmeGJXid-T_LACPz0Prg8mtPc5yWNFXLbnsbqGFFZ_R0pQKkTncOYVnW6msOFUia0pw",
//     "cache-control": "no-cache",
//     "content-type": "application/json",
//     "getapitokenauth": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImMyMGM4ZTFkIn0.eyJzdWIiOiI5OWE3ODNjNy0yNGVjLTQ5MDktYTIyMC02MWEwNzY5YjRjNGUiLCJuYW1lIjoiQWRpdHlhIEphaXN3YWwiLCJlbWFpbCI6ImFkaXR5YS5qQHByb3RlY3RvbmNlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJtZXRhZGF0YSI6e30sInJvbGVzIjpbXSwicGVybWlzc2lvbnMiOltdLCJ0ZW5hbnRJZCI6IjU4NWRjYzRjLTBjZGMtNDkxNC04OTYyLTQ5Yjg1ZTI0MDJhNCIsInRlbmFudElkcyI6WyJkYjA5Y2YzNi0zOTdmLTQ2ZGMtOTE1ZC0xODc0ZTk3NTE4MzIiLCIxNmU4NzQ0MC1mYmU5LTRiZWUtYmE1Yy0yNzk2MzdmODY0YTYiLCI1ODVkY2M0Yy0wY2RjLTQ5MTQtODk2Mi00OWI4NWUyNDAyYTQiLCJjMzZhNTUyNS0yNGFkLTRlNmYtYjg4ZC00NzNiZmM5ZGY5YzAiLCI3NWU2YTUzZS0wYmRjLTRmM2MtYmVhMC03OTRjMjljOGQzY2EiLCI4MDA1MmFkZS04NGFkLTQ2NWYtYTc3Yi00NGM1ODliOTk2M2IiLCIyMmE0ODEyMi1iM2RkLTQ3NjItYmIwZC04MmEwMWE3YTI5YTciLCJlYzc5ODg0Ny1hZWY5LTQ0YWMtOTUxYS02MTg0Njc1NmY0MmUiLCJkNDFmZjU4YS0wMDgzLTRlOTItOGEzNS0zNWZhMGYwN2YxMTUiLCIxMmJhZmRmZC1kNDgxLTRmMzQtOGQ1YS0wNGFmZDcyYWNiZTYiXSwicHJvZmlsZVBpY3R1cmVVcmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BTG01d3UyMVFsVW1DUXRIdWtKNFBLaHl1cVlsdFZaWFRIbGl1anNUSzFGVT1zOTYtYyIsInNpZCI6ImQ2YmM4MzVlLWIyZTUtNGFlNS04ZTJkLWFkOGY5MWEwZjBkMyIsInR5cGUiOiJ1c2VyVG9rZW4iLCJhdWQiOiJjMjBjOGUxZC05YmM4LTQ2N2ItYjljOC0xYzdlMDdjNTJmNzMiLCJpc3MiOiJodHRwczovL2ZlLmRldi5wcm90ZWN0b25jZS5jb20iLCJpYXQiOjE2ODUzNjY5NjcsImV4cCI6MTY4NTQ1MzM2N30.Saa9CKdDXCKmZjHE3WqWYIAuRhDzP_FkrDwhGDDhce6RX5INp5FcRQYhR6dmzwYm7rRGNYdHO56pqpfHCMMVNU7JCZ2ySkbctLoPs9xKPIHA6QxUon-Ya83uN9HLqpU9ey5AfAJNe8WodouePv1Q8rc9CuB2KCjdvrnDc-k29nLQdc_Evw4YY1L56ZMkfPIX8dMTNKOm4qxR65uKkYNAliLc-xoo5_6IKmuTyXfMziE855NBvVooCHuOVwZt_9wzBoiwW7gpGKG32LQStaFAmeGJXid-T_LACPz0Prg8mtPc5yWNFXLbnsbqGFFZ_R0pQKkTncOYVnW6msOFUia0pw",
//     "pragma": "no-cache",
//     "sec-ch-ua": "\"Google Chrome\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Linux\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-site"
//   },
//   "referrer": "https://dev.protectonce.com/",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "{\"query\":\"query ($id: String!) {\\n  getApplication(application_id: $id)\\n}\\n\",\"variables\":{\"id\":\"PO_01f4574e-bd30-478d-9e3b-3f30be3148e0\"}}",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "include"
// });
