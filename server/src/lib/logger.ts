import pino from 'pino';

// Structured logger used throughout the server.
//
// In production (NODE_ENV=production): outputs newline-delimited JSON — one
// object per event — suitable for log aggregators (Datadog, Loki, CloudWatch).
// In development: outputs coloured, human-readable output via pino-pretty.
//
// Usage:
//   import logger from './lib/logger.js';
//   logger.info({ reqId, route }, 'RSVP submitted');
//   logger.error({ err }, 'DB failure');

const isDev = process.env.NODE_ENV !== 'production';

// pino.transport() returns a properly-typed DestinationStream, avoiding the
// type mismatch that arises when passing a plain transport config object as
// the second argument to pino().
const transport = isDev
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    // Redact sensitive fields that should never appear in logs.
    // Paths use dot-notation; wildcards cover nested objects.
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        '*.password',
        '*.token',
        '*.jwt',
      ],
      censor: '[REDACTED]',
    },
    base: { service: 'invitation-server' },
  },
  transport,
);

export default logger;
