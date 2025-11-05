import {
  IsString,
  IsEmail,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ContactInfoUpdateDto {
  @ApiProperty({ example: 'juanperez@mail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+58-412-1234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdatePatientDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiProperty({ type: ContactInfoUpdateDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoUpdateDto)
  contact_info?: ContactInfoUpdateDto;
}
