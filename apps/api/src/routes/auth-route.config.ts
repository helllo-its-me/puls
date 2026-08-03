export const authRequestBodyMaximumBytes = 16 * 1024;

export type AuthRouteConfig = {
  registrationMinimumResponseMilliseconds: number;
  passwordResetMinimumResponseMilliseconds: number;
  webAppOrigins: readonly string[];
  allowUnlistedWebOrigins: boolean;
  secureWebCookies: boolean;
};
