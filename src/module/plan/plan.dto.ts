import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  dailyLimit: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value * 100)
  price: number;

  @IsString()
  currency: string;

  @IsBoolean()
  isPaid: boolean;
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
}
