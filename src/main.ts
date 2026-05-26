import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174']
      : true,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('GamePM API')
    .setDescription('Oyun stüdyosu proje yönetim sistemi API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`GamePM API: http://localhost:${port}`);
  console.log(`Swagger:    http://localhost:${port}/api`);
}
bootstrap();
