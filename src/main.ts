import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/exception-filters/global-exception.filter";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that don't have decorators
      transform: true, // transform payloads to DTO instances
      forbidNonWhitelisted: true, // throw error if non-whitelisted values are provided
      stopAtFirstError: true, // Add this to stop at first error
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
