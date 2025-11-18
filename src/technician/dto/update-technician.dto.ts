import { PartialType } from '@nestjs/swagger';
import { CreateTechnicianDto } from './send-report-email.dto';

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {}
