import pino from 'pino';

const baseOptions = {
  level: process.env.LOG_LEVEL ?? 'info'
};

const devTransport = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
};

export const logger = pino(
  process.env.NODE_ENV === 'production'
    ? baseOptions
    : {
        ...baseOptions,
        ...devTransport
      }
);
