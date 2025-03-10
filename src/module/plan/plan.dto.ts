import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  totalLimit: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value * 100)
  price: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsBoolean()
  isPaid: boolean;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value * 100)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
