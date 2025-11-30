import { Module } from '@nestjs/common';
import { HistoryAttentionsService } from './history-attentions.service';
import { HistoryAttentionsController } from './history-attentions.controller';

@Module({
  controllers: [HistoryAttentionsController],
  providers: [HistoryAttentionsService],
})
export class HistoryAttentionsModule {}
