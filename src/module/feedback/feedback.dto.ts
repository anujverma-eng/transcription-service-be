// src/modules/feedback/dto/feedback.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from "class-validator";

export class CreateFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  review: string;
}

export class UpdateFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  review?: string;
}

export class AdminSelectFeedbackDto {
  @IsBoolean()
  adminSelected: boolean;
}
