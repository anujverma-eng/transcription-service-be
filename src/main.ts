/* eslint-disable */
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/exception-filters/global-exception.filter";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { getQueueToken } from "@nestjs/bull";
import passport from "passport";
import { NextFunction, Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie-parser middleware
  app.use(cookieParser());

  app.enableCors({
    origin: ["http://localhost:5173","http://localhost:3000", "https://audiolekh.com", "http://audiolekh.com"],
    credentials: true,
  });

  const transcriptionQueue = app.get(getQueueToken("transcription"))
  const notificationQueue = app.get(getQueueToken("notifications"))

  console.log('✅ Bull Queues initialized:', {
    transcription: transcriptionQueue.name,
    notifications: notificationQueue.name
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues/bull-board");

  createBullBoard({
    queues: [
      new BullAdapter(transcriptionQueue),
      new BullAdapter(notificationQueue),
    ],
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: "Transcription Jobs || Bull Board",
      },
    },
  });

  const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "jwt-access",
      { session: false },
      (err, user, info) => {
        if (err || !user || user.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Forbidden",
          });
        }
        req.user = user; // Attach user to request
        next(); // Proceed to the next middleware
      },
    )(req, res, next);
  };
  
  // Mount Bull Board's router on /admin/queues with admin middleware
  app.use("/admin/queues/bull-board", adminMiddleware, serverAdapter.getRouter());

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
  const configService = app.get(ConfigService);
  await app.listen(configService.get("port"));

}
bootstrap();
