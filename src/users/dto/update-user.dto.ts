import { IsString, IsOptional, IsIn, MinLength, Matches, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Za-z])(?=.*[0-9])/, {
    message: 'Şifre en az bir harf ve bir rakam içermelidir',
  })
  password?: string;

  @IsOptional()
  @IsIn(['admin', 'developer', 'designer'])
  role?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
