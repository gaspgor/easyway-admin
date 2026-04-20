import { NestFactory } from '@nestjs/core';
import { AppModule, adminJsOptions } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import express from 'express';
import bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();
  
  // Expose the public folder for static asset mounting (like custom admin scripts!)
  app.getHttpAdapter().getInstance().use(express.static('public'));

  // Natively attach AdminJS entirely bypassing NestJS 11 middleware architecture!
  const adminJs = new AdminJS(adminJsOptions);
  
  const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
    authenticate: async (email, password) => {
        const user = await Admin.findOne({ where: { email } });
        if (user) {
            const matched = await bcrypt.compare(password, user.passwordHash);
            if (matched) {
                return user; // Passes securely!
            }
        }
        return false;
    },
    cookiePassword: process.env.COOKIE_PASSWORD || 'EasyWaySuperSecretCookiePasswordEncryptionKey2026!',
    cookieName: 'easyway_admin_session',
  }, null, {
    resave: false,
    saveUninitialized: true,
    secret: process.env.COOKIE_PASSWORD || 'EasyWaySuperSecretCookiePasswordEncryptionKey2026!',
  });

  app.getHttpAdapter().getInstance().use(adminJs.options.rootPath, router);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`EasyWay Admin Platform running on port ${port}`);
}
bootstrap();
