import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

   app.enableCors({
    origin: [
      'https://gestor-archivos-uoca-backend.onrender.com',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades desconocidas
      forbidNonWhitelisted: true, // lanza error si mandan campos no definidos
      transform: true, // convierte tipos automáticamente
    }),
  );

  // Configuración Swagger
  const config = new DocumentBuilder()
    .setTitle('Gestor Médico UOCA')
    .setDescription('API para gestionar el manejo de archivos médicos en la UOCA 🏥')
    .setVersion('1.0.0')
    .addTag('doctors', 'Gestión de doctores')
    .addTag('patients', 'Gestión de pacientes')
    .addTag('items', 'Gestión de estudios o ítems')
    .addTag('daily-patients', 'Citas diarias de pacientes')
    .addServer(process.env.BASE_URL || 'http://localhost:3001', 'Servidor activo') 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
    customSiteTitle: 'Gestor Médico UOCA - API Docs',
  });

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

}

bootstrap();
