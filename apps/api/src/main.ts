import 'reflect-metadata';

import { fileURLToPath } from 'node:url';

import { NestFactory } from '@nestjs/core';
import { configurePlatformApp } from '@solidvs/server';

import { AppModule } from './app.module.js';
import { readConfig } from './config.js';
import { serveSpa } from './spa.js';

const config = readConfig();
const app = await NestFactory.create(AppModule.forRoot(config), { bufferLogs: true });
configurePlatformApp(app);
serveSpa(app, process.env.WEB_DIR ?? fileURLToPath(new URL('../public', import.meta.url)));
await app.listen(config.PORT, '0.0.0.0');
