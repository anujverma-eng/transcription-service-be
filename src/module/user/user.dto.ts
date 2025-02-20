import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { UserRole } from "src/common/utils/enum/util.enum";

export class CreateUserDto {
  @IsEmail({}, { message: "Enter a Valid Email" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  name: string;

  @IsNotEmpty({ message: "Phone is required" })
  @IsString({ message: "Phone must be a string" })
  phone: string;

  @IsOptional()
  @IsString({ message: "Organization must be a string" })
  organization: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "Role must be a valid role" })
  role: UserRole = UserRole.USER;

  @IsOptional()
  @IsBoolean({ message: "IsActive must be a boolean" })
  isActive: boolean = true;

  @IsOptional()
  @IsString({ message: "GoogleId must be a string" })
  googleId: string;

  @IsOptional()
  @IsDateString()
  lastLogin: Date = new Date();
}
