// history-attentions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryAttentionSchema, HistoryAttention } from './entities/history-attention.schema';
import { HistoryAttentionsService } from './history-attentions.service';
import { HistoryAttentionsController } from './history-attentions.controller';
import { PatientsModule } from 'src/patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HistoryAttention.name, schema: HistoryAttentionSchema },
    ]),
    PatientsModule
  ],
  controllers: [HistoryAttentionsController],
  providers: [HistoryAttentionsService],
  exports: [HistoryAttentionsService],
})
export class HistoryAttentionsModule {}
