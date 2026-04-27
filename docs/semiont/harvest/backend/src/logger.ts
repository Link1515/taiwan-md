/**
 * Centralised pino logger.
 *
 * Two transports:
 *  - In dev (HARVEST_LOG_PRETTY=true): pino-pretty for human-readable output.
 *  - In prod: raw JSON, suitable for shipping to a log aggregator.
 */

import pino from 'pino';
import { config } from './config.ts';

function buildLogger(): pino.Logger {
  if (config.logPretty) {
    return pino({
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    });
  }
  return pino({ level: config.logLevel });
}

export const logger = buildLogger();

/** Create a child logger with structured context. */
export function child(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}
