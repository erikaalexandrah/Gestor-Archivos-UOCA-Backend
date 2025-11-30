import { PartialType } from '@nestjs/swagger';
import { CreateHistoryAttentionDto } from './create-history-attention.dto';

export class UpdateHistoryAttentionDto extends PartialType(CreateHistoryAttentionDto) {}
