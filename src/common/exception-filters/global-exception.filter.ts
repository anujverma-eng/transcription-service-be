import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();

      return response.status(status).json({
        success: false,
        statusCode: status,
        message: errorResponse,
        timestamp: new Date().toISOString(),
        path: request.url,
        errorFrom: "transcription-service | GlobalExceptionFilter",
      });
    } else {
      return response.status(500).json({
        success: false,
        statusCode: 500,
        message: `Internal Server Error: ${JSON.stringify(exception)}`,
        timestamp: new Date().toISOString(),
        path: request.url,
        errorFrom: "transcription-service | GlobalExceptionFilter",
      });
    }
  }
}
