import { databaseConfigSchema, loadConfig, platformConfigSchema } from '@solidvs/server';
import { z } from 'zod';

/**
 * Configuration of this system. The platform delivers it as one JSON file at /run/secrets/config
 * (local development: CONFIG_FILE=config.local.json). Add the system's own keys here; the system
 * refuses to start when one is missing. The DATABASE_* keys carry the application login
 * (ADR-0016); the migration login never reaches the running service.
 */
export const configSchema = platformConfigSchema.extend(databaseConfigSchema.shape).extend({
  /** Release identifier set by the platform at deploy time; "dev" locally. */
  RELEASE: z.string().default('dev'),
});

export type Config = z.infer<typeof configSchema>;

export function readConfig(): Config {
  return loadConfig(configSchema);
}
