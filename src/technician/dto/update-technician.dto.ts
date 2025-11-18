import { PartialType } from '@nestjs/swagger';
import { SendReportEmailDto} from './send-report-email.dto';

export class UpdateReportEmailDto extends PartialType(SendReportEmailDto) {}
