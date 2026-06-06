import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
  });

  // Serve static assets from 'public' folder
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/widget',
  });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`NestJS Backend running on: http://localhost:${port}`);
}
bootstrap();


