import { IsString, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PatientDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  fid_number: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'juanperez@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+58-412-1234567' })
  @IsString()
  phone: string;
}

class DoctorDto {
  @ApiProperty({ example: 'GOMEZ_MARIA_J' })
  @IsString()
  cyclhos_name: string;
}

class StudyDto {
  @ApiProperty({ example: 'TOPOGRAFÍA CORNEAL' })
  @IsString()
  item: string;
}

export class CreateDailyPatientDto {
  @ApiProperty({ example: '2025-10-27' })
  @IsString()
  appointment_date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  appointment_time: string;

  @ApiProperty({ type: PatientDto })
  @ValidateNested()
  @Type(() => PatientDto)
  patient: PatientDto;

  @ApiProperty({ type: DoctorDto })
  @ValidateNested()
  @Type(() => DoctorDto)
  doctor: DoctorDto;

  @ApiProperty({ type: StudyDto })
  @ValidateNested()
  @Type(() => StudyDto)
  study: StudyDto;

  @ApiProperty({ example: 'excel', enum: ['excel', 'manual'], required: false })
  @IsOptional()
  @IsString()
  source?: string;
}
