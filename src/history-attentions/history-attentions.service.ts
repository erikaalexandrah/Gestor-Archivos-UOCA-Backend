import { Injectable } from '@nestjs/common';
import { CreateHistoryAttentionDto } from './dto/create-history-attention.dto';
import { UpdateHistoryAttentionDto } from './dto/update-history-attention.dto';

@Injectable()
export class HistoryAttentionsService {
  create(createHistoryAtttentionDto: CreateHistoryAttentionDto) {
    return 'This action adds a new historyAtttention';
  }

  findAll() {
    return `This action returns all historyAttentions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} historyAttention`;
  }

  update(id: number, updateHistoryAttentionDto: UpdateHistoryAttentionDto) {
    return `This action updates a #${id} historyAttention`;
  }

  remove(id: number) {
    return `This action removes a #${id} historyAttention`;
  }
}
