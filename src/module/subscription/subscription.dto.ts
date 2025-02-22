import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsMongoId,
  Min,
  IsDate,
} from "class-validator";

export class CreateSubscriptionDto {
  @IsString()
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  planId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number = 5;

  @IsOptional()
  @IsInt()
  dailyUsed?: number = 0;

  @IsOptional()
  @IsDate()
  startDate?: Date = new Date();

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean = false;
}
