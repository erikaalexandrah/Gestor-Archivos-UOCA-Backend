import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,     // ← muy importante para @Type()
      whitelist: true,     // elimina campos extra no declarados en el DTO
      forbidNonWhitelisted: false, // si quieres que falle con 400 ante campos extra, pon true
    }),
  );

  // ✅ Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // ✅ Lista de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:5173', // React local (Vite)
    'http://localhost:3000', // React local (CRA)
    'http://localhost:3001', // Swagger local
    'https://gestor-archivos-uoca-backend.onrender.com', // Render (producción)
    'https://node-7s3gk9.erikahernandez.dev', // Dominio personalizado
  ];

  // Habilitar CORS abierto: permitir todos los orígenes.
  // Nota: esto deja la API accesible desde cualquier origen.
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // ⚙️ Swagger configurado para los tres entornos
  const config = new DocumentBuilder()
    .setTitle('Gestor de Archivos UOCA')
    .setDescription('API para gestión de pacientes')
    .setVersion('1.0')
    .addServer('http://localhost:3001', 'Localhost')
    .addServer('https://node-7s3gk9.erikahernandez.dev', 'Producción (dominio personalizado)')
    .addServer('https://gestor-archivos-uoca-backend.onrender.com', 'Producción (Render)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 🚀 Escucha en el puerto 3001 o el asignado por Render
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Servidor corriendo en http://localhost:${port}/api`);
  console.log(`✅ Swagger disponible en:`);
  console.log(`   • http://localhost:${port}/api`);
  console.log(`   • https://gestor-archivos-uoca-backend.onrender.com/api`);
  console.log(`   • https://node-7s3gk9.erikahernandez.dev/api`);
}

bootstrap();
