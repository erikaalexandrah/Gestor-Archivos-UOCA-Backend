import {
  IsString,
  IsEmail,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ContactInfoDto {
  @ApiProperty({ example: 'juanperez@mail.com', required: false })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+58-412-1234567', required: false })
  @IsString()
  phone: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  fid_number: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info: ContactInfoDto;
}
