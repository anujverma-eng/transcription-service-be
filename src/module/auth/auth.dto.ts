import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

import { IsEmail } from "class-validator";

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class SignUpDto {
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

  @IsOptional()
  @IsNotEmpty({ message: "Phone is required" })
  @IsString({ message: "Phone must be a string" })
  phone: string;

  @IsOptional()
  @IsString({ message: "Organization must be a string" })
  organization: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString({ message: "Token must be a string" })
  token: string;

  @IsNotEmpty()
  @IsString({ message: "New password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  newPassword: string;
}
