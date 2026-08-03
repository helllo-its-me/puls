import { z } from 'zod';

import { isLocalRuntimeMode, readRuntimeMode } from './runtime-mode.js';

const defaultTrustedProxyHops = 0;
const defaultRegistrationMinimumResponseMilliseconds = 1_000;
const defaultPasswordResetMinimumResponseMilliseconds = 1_000;
const deployedMinimumResponseMilliseconds = 1_000;

const apiSecurityEnvironmentSchema = z.object({
  AUTH_TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(defaultTrustedProxyHops),
  REGISTRATION_MIN_RESPONSE_MS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .default(defaultRegistrationMinimumResponseMilliseconds),
  PASSWORD_RESET_MIN_RESPONSE_MS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .default(defaultPasswordResetMinimumResponseMilliseconds),
  WEB_APP_ORIGINS: z.string().trim().default('')
});

export type ApiSecurityConfig = {
  trustedProxyHops: number;
  registrationMinimumResponseMilliseconds: number;
  passwordResetMinimumResponseMilliseconds: number;
  webAppOrigins: readonly string[];
  allowUnlistedWebOrigins: boolean;
  secureWebCookies: boolean;
};

function parseWebAppOrigins(value: string, requireHttps: boolean): string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      const parsedOrigin = new URL(origin);

      if (parsedOrigin.origin !== origin) {
        throw new Error(`WEB_APP_ORIGINS entry must be an origin: ${origin}`);
      }

      if (requireHttps && parsedOrigin.protocol !== 'https:') {
        throw new Error(`WEB_APP_ORIGINS entry must use HTTPS: ${origin}`);
      }

      return parsedOrigin.origin;
    });

  if (requireHttps && origins.length === 0) {
    throw new Error('WEB_APP_ORIGINS is required outside development and test');
  }

  return origins;
}

export function readApiSecurityConfig(
  environment: NodeJS.ProcessEnv = process.env
): ApiSecurityConfig {
  const runtimeMode = readRuntimeMode(environment);
  const isLocalRuntime = isLocalRuntimeMode(runtimeMode);
  const config = apiSecurityEnvironmentSchema.parse(environment);

  if (
    !isLocalRuntime
    && config.REGISTRATION_MIN_RESPONSE_MS < deployedMinimumResponseMilliseconds
  ) {
    throw new Error(
      `REGISTRATION_MIN_RESPONSE_MS must be at least ${deployedMinimumResponseMilliseconds}`
    );
  }

  if (
    !isLocalRuntime
    && config.PASSWORD_RESET_MIN_RESPONSE_MS < deployedMinimumResponseMilliseconds
  ) {
    throw new Error(
      `PASSWORD_RESET_MIN_RESPONSE_MS must be at least ${deployedMinimumResponseMilliseconds}`
    );
  }

  return {
    trustedProxyHops: config.AUTH_TRUST_PROXY_HOPS,
    registrationMinimumResponseMilliseconds: config.REGISTRATION_MIN_RESPONSE_MS,
    passwordResetMinimumResponseMilliseconds: config.PASSWORD_RESET_MIN_RESPONSE_MS,
    webAppOrigins: parseWebAppOrigins(config.WEB_APP_ORIGINS, !isLocalRuntime),
    allowUnlistedWebOrigins: isLocalRuntime,
    secureWebCookies: !isLocalRuntime
  };
}
