import { IsString, IsEmail, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger'; 

class ContactInfoDto {
  @ApiProperty({ example: 'dgomez@clinic.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+58-414-5556789' })
  @IsString()
  phone: string;
}

export class CreateDoctorDto {
  @ApiProperty({ example: '98765432' })
  @IsString()
  @IsNotEmpty()
  fid_number: string;

  @ApiProperty({ example: 'Dra. Gómez' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'GOMEZ_MARIA_J' })
  @IsString()
  @IsNotEmpty()
  cyclhos_name: string;

  @ApiProperty({ type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info: ContactInfoDto;
}
