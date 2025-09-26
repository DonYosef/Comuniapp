import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  /*
  // Configuración de validación global - COMPLETAMENTE DESHABILITADO PARA DEBUG
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: false, // Deshabilitado para debug
  //   forbidNonWhitelisted: false,
  //   skipMissingProperties: false,
  //   skipNullProperties: false, // NO saltar propiedades null
  //   skipUndefinedProperties: false, // NO saltar propiedades undefined
  //   transformOptions: {
  //     enableImplicitConversion: false, // No convertir automáticamente
  //   },
  // }));
*/
  // Configuración de CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Comuniapp API')
    .setDescription('API para la aplicación de comunidades')
    .setVersion('1.0')
    .addTag('health')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 API ejecutándose en http://localhost:${port}`);
  console.log(`📚 Documentación disponible en http://localhost:${port}/api`);
}

bootstrap();
