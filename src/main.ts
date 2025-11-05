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

  // ✅ CORS correctamente configurado
  app.enableCors({
    origin: (origin, callback) => {
      // Permite requests sin origen (como Postman, Swagger local, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Bloqueado por CORS: ${origin}`);
        callback(new Error('No autorizado por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // 🚨 Middleware opcional (refuerzo de headers, no obligatorio pero útil)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
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
  SwaggerModule.setup('api', app, document);

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
