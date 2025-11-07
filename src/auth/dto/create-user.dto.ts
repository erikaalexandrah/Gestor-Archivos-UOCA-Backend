import { IsString, Matches, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @Matches(/^[0-9]{4,8}$/, {
    message: 'La contraseña debe ser numérica de 4 a 8 dígitos',
  })
  password: string;

  @IsOptional()
  @IsIn(['admin', 'doctor', 'technician'], {
    message: 'role debe ser admin, doctor o technician',
  })
  role?: string; // opcional (solo admin debería poder enviarlo)
}
