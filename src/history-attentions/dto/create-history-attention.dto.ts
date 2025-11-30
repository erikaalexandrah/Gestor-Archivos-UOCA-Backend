import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class EmailStatusDto {
  @ApiProperty({ example: true, description: 'Indicates if the email was sent' })
  @IsBoolean()
  sent: boolean;

  @ApiProperty({ example: '2025-10-29T14:00:00Z', description: 'Time when email was sent' })
  @IsOptional()
  @IsDateString()
  sent_time?: string;
}

class MetadataDto {
  @ApiProperty({ example: 'manual', description: 'Source of creation' })
  @IsString()
  source: string;

  @ApiProperty({ example: '2025-10-29T13:00:00Z', description: 'Creation timestamp' })
  @IsOptional()
  @IsDateString()
  created_at?: string;

  @ApiProperty({ example: '2025-10-30T08:00:00Z', description: 'Update timestamp' })
  @IsOptional()
  @IsDateString()
  updated_at?: string;
}

export class CreateHistoryAttentionDto {
  @ApiProperty({ example: '2025-10-30', description: 'Date of the appointment' })
  @IsString()
  appointment_date: string;

  @ApiProperty({ example: '14:30', description: 'Time of the appointment' })
  @IsString()
  appointment_time: string;

  @ApiProperty({ example: '60f7c0a1b3e2f7001a2b3c4d', description: 'Patient ID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ example: '60f7c0a1b3e2f7001a2b3c4e', description: 'Doctor ID' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ example: '60f7c0a1b3e2f7001a2b3c4f', description: 'Item ID' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: false, description: 'Indicates if appointment is completed' })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({
    example: ['\\\\server\\results\\file1.pdf', '\\\\server\\results\\file2.pdf'],
    description: 'Array of result file URLs',
  })
  @IsArray()
  @IsString({ each: true })
  result_url: string[];

  @ApiProperty({ type: EmailStatusDto, description: 'Email sent status and time' })
  @ValidateNested()
  @Type(() => EmailStatusDto)
  email_status: EmailStatusDto;

  @ApiProperty({ example: '60f7c0a1b3e2f7001a2b3c50', description: 'User ID that cancelled the appointment', required: false })
  @IsOptional()
  @IsString()
  cancelled_id?: string;

  @ApiProperty({ type: MetadataDto, description: 'Audit metadata' })
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;
}
