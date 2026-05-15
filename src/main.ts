import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 AI Code Review Agent running on http://localhost:${port}`);
  console.log(`💻 Web Review IDE available at http://localhost:${port}/index.html\n`);
}
bootstrap();
