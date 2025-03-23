import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateContactUsDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
