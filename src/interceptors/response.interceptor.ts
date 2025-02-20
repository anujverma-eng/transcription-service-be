/* eslint-disable */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Request, Response } from "express";
import { map } from "rxjs/operators";

// Interface for pagination data
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface for error structure
interface ErrorResponse {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Interface for the unified response structure
interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T | null;
  dataFrom: string;
  error: ErrorResponse | null;
  pagination?: PaginationData;
}

interface ResponseData {
  data?: any;
  message?: string;
  pagination?: PaginationData;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly SERVICE_NAME = "transcription-service";

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((responseData: T | ResponseData) => {
        const status = response.statusCode;
        const isSuccess = status < 400;

        const data = (responseData as ResponseData)?.data ?? responseData;
        const pagination = (responseData as ResponseData)?.pagination;
        const message = (responseData as ResponseData)?.message || 
          this.getDefaultMessage(request.method, isSuccess);

        // Construct the unified response
        const unifiedResponse: ApiResponse<T> = {
          status,
          success: isSuccess,
          message,
          data: isSuccess ? data : null,
          dataFrom: this.SERVICE_NAME,
          error: !isSuccess
            ? {
                message: typeof data === "string" ? data : message,
                status,
                details: typeof data === "object" ? data : undefined,
              }
            : null,
          ...(pagination && { pagination }),
        };

        return unifiedResponse;
      }),
    );
  }

  private getDefaultMessage(method: string, isSuccess: boolean): string {
    if (!isSuccess) return "Operation failed";

    switch (method.toUpperCase()) {
      case "GET":
        return "Data retrieved successfully";
      case "POST":
        return "Resource created successfully";
      case "PUT":
      case "PATCH":
        return "Resource updated successfully";
      case "DELETE":
        return "Resource deleted successfully";
      default:
        return "Operation successful";
    }
  }
}
