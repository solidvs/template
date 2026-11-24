import { aboutResponse, type AboutResponse } from '@example/contracts';
import { Controller, Get, Inject } from '@nestjs/common';

import { GetSystemInfo } from '../application/get-system-info.js';

/**
 * HTTP layer: translates requests into use cases and validates every response against its
 * contract (packages/contracts). Requires a session, like every route not marked @Public().
 */
@Controller('about')
export class AboutController {
  constructor(@Inject(GetSystemInfo) private readonly getSystemInfo: GetSystemInfo) {}

  @Get()
  about(): AboutResponse {
    return aboutResponse.parse(this.getSystemInfo.execute());
  }
}
