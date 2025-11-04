import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  /**
   * 🌍 CORS Configuration
   * Compatible con desarrollo local, Render y tu dominio personalizado
   */
  app.enableCors({
    origin: [
      'http://localhost:5173', // desarrollo (Vite/React)
      'https://gestor-archivos-uoca-backend.onrender.com', // backend público en Render
      'https://node-7s3gk9.erikahernandez.dev', // dominio personalizado
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no esperadas
      forbidNonWhitelisted: true, // lanza error si envían campos no definidos
      transform: true, // convierte tipos (por ejemplo, strings a números)
    }),
  );

  /**
   * 📘 Swagger Configuration
   */
  const config = new DocumentBuilder()
    .setTitle('Gestor Médico UOCA')
    .setDescription('API para gestionar el manejo de archivos médicos en la UOCA 🏥')
    .setVersion('1.0.0')
    .addTag('doctors', 'Gestión de doctores')
    .addTag('patients', 'Gestión de pacientes')
    .addTag('items', 'Gestión de estudios o ítems')
    .addTag('daily-patients', 'Citas diarias de pacientes')
    .addServer('https://gestor-archivos-uoca-backend.onrender.com', 'Render (Producción)')
    .addServer('https://node-7s3gk9.erikahernandez.dev', 'Dominio Personal')
    .addServer('http://localhost:3001', 'Local (Desarrollo)')
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

  console.log(`🚀 Servidor corriendo en http://localhost:${port}/api`);
  console.log(`📘 Documentación Swagger en /api/docs`);
}

bootstrap();
