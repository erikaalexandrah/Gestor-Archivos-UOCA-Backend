import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-doctor.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  @ApiPropertyOptional({ example: 'Dr. Juan Pérez' })
  full_name?: string;

  @ApiPropertyOptional({ example: '+58-414-5556789' })
  phone?: string;
}
