export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN!,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID!,
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: 'openid profile email'
  },
  useRefreshTokens: true,
  cacheLocation: 'localstorage' as const
};