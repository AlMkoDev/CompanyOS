import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getEnableHsts, getFrontendOrigins, getPort } from './common/env';
import { applySecurityHeaders } from './common/security-headers';
import { validateEnvironment } from './common/env.validation';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule);
  const frontendOrigins = getFrontendOrigins();
  const enableHsts = getEnableHsts();
  const port = getPort();
  
  // Enable CORS
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.use((req, res, next) => {
    applySecurityHeaders(res, req.path, { hstsEnabled: enableHsts });
    next();
  });

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('CompanyOS API')
    .setDescription('CompanyOS Supply Chain Management API Documentation')
    .setVersion('1.0')
    .addTag('supply-chain', 'Supply Chain Management endpoints')
    .addTag('products', 'Product management')
    .addTag('suppliers', 'Supplier management')
    .addTag('inventory', 'Inventory and stock management')
    .addTag('po-documents', 'Purchase Order document management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
