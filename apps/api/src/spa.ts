import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { INestApplication } from '@nestjs/common';
import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';

/**
 * Serves the web app from the same origin as the API (one image, no CORS). Files are served as
 * built; any other GET outside /api returns index.html so client-side routes work on reload.
 */
export function serveSpa(app: INestApplication, directory: string): void {
  const index = join(directory, 'index.html');
  if (!existsSync(index)) return;
  const server = app.getHttpAdapter().getInstance() as Express;
  server.use(
    express.static(directory, {
      index: false,
      setHeaders: (res, path) => {
        res.setHeader('Cache-Control', path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );
  server.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
