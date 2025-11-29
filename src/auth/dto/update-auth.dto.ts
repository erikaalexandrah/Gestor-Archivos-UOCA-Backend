import { IsString, IsOptional, Matches, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @Matches(/^[0-9]{4,8}$/, {
    message: 'La contraseña debe ser numérica de 4 a 8 dígitos',
  })
  password?: string;

  @IsOptional()
  @IsIn(['admin', 'doctor', 'technician'])
  role?: string;

  @IsOptional()
  @IsString()
  filePath?: string;
}
