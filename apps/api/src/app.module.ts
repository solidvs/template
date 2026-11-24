import { Global, Module, type DynamicModule } from '@nestjs/common';
import { PlatformModule, type IdentityProvider } from '@solidvs/server';

import type { Config } from './config.js';
import { databaseModule } from './database.js';
import { AboutModule } from './modules/about/about.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { SYSTEM } from './system.js';
import { CONFIG } from './tokens.js';

type AppOptions = {
  identityProvider?: IdentityProvider;
  /** Replaces the database: `TestDataModule.forRoot()` of @solidvs/server/testing in HTTP tests. */
  database?: DynamicModule;
};

/**
 * Root module. Who may enter and what roles exist are declared here (ADR-0009): department opens
 * the door; roles that change data come from directory groups only.
 */
@Global()
@Module({})
export class AppModule {
  static forRoot(config: Config, options: AppOptions = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        PlatformModule.forRoot({
          system: SYSTEM.id,
          config,
          access: { departments: ['TI'] },
          roles: { admin: { groups: ['GRP-Example-Admins'] } },
          ...(options.identityProvider ? { identityProvider: options.identityProvider } : {}),
        }),
        options.database ?? databaseModule(config),
        AboutModule,
        ProjectsModule,
      ],
      providers: [{ provide: CONFIG, useValue: config }],
      exports: [CONFIG],
    };
  }
}
