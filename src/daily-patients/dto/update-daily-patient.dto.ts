import { PartialType } from '@nestjs/swagger';
import { CreateDailyPatientDto } from './create-daily-patient.dto';

export class UpdateDailyPatientDto extends PartialType(CreateDailyPatientDto) {}
