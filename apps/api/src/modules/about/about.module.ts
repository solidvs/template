import { Module } from '@nestjs/common';

import { CONFIG } from '../../tokens.js';
import type { Config } from '../../config.js';
import { SYSTEM } from '../../system.js';
import { GetSystemInfo } from './application/get-system-info.js';
import { AboutController } from './http/about.controller.js';

@Module({
  controllers: [AboutController],
  providers: [
    {
      provide: GetSystemInfo,
      inject: [CONFIG],
      useFactory: (config: Config) => new GetSystemInfo(SYSTEM, config.RELEASE),
    },
  ],
})
export class AboutModule {}
