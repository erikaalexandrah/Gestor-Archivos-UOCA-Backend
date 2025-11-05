import {
  IsString,
  IsOptional,
  IsEmail,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PatientDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  fid_number: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'juanperez@mail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+58-412-1234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

class DoctorDto {
  @ApiProperty({ example: 'GOMEZ_MARIA_J' })
  @IsString()
  @IsNotEmpty()
  cyclhos_name: string;
}

class StudyDto {
  @ApiProperty({ example: 'TOPOGRAFÍA CORNEAL' })
  @IsString()
  @IsNotEmpty()
  item: string;
}

export class CreateDailyPatientDto {
  @ApiProperty({ example: '2025-10-27' })
  @IsString()
  @IsNotEmpty()
  appointment_date: string; // YYYY-MM-DD

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  appointment_time: string; // HH:mm

  @ApiProperty({ type: PatientDto })
  @ValidateNested()
  @Type(() => PatientDto)
  @IsNotEmpty()
  patient: PatientDto;

  @ApiProperty({ type: DoctorDto })
  @ValidateNested()
  @Type(() => DoctorDto)
  @IsNotEmpty()
  doctor: DoctorDto;

  @ApiProperty({ type: StudyDto })
  @ValidateNested()
  @Type(() => StudyDto)
  @IsNotEmpty()
  study: StudyDto;

  @ApiProperty({ example: 'excel', enum: ['excel', 'manual'], required: false })
  @IsOptional()
  @IsString()
  source?: string;
}
