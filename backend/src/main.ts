import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Prefijo global para la API REST
  app.setGlobalPrefix('api');

  // 2. Seguridad HTTP (Helmet)
  app.use(helmet());

  // 3. Configuración CORS
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:5173');
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 4. Transformación y Serialización Global (excluye contraseñas en respuestas)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 5. Validación estricta de Payloads con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Documentación interactiva OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SoporTI - API de Mesa de Ayuda y Gestión de Activos TI')
    .setDescription(
      'Documentación técnica interactiva de los endpoints REST de SoporTI. Incluye módulos de Autenticación, RBAC, Tickets, Inventario, Asistente RAG y Ley 1581 de 2012.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Introduce tu token JWT de acceso (ejemplo: Bearer eyJhbGciOi...)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('port', 4000);
  await app.listen(port);

  logger.log(`🚀 SoporTI Backend escuchando en: http://localhost:${port}/api`);
  logger.log(`📚 Swagger OpenAPI disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
