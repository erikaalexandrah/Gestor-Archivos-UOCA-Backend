import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string; 

  @IsString()
  @Matches(/^[0-9]+$/, { message: 'La contraseña debe ser solo números' })
  @MinLength(4)
  @MaxLength(8)
  password: string; 
}
