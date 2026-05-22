import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Za-z])(?=.*[0-9])/, {
    message: 'Şifre en az bir harf ve bir rakam içermelidir',
  })
  password: string;

  @IsOptional()
  @IsIn(['developer', 'designer'])
  role?: string;
}
