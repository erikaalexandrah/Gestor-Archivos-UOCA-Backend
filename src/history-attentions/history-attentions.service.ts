import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHistoryAttentionDto } from './dto/create-history-attention.dto';
import { UpdateHistoryAttentionDto } from './dto/update-history-attention.dto';
import { HistoryAttention} from './entities/history-attention.schema';

@Injectable()
export class HistoryAttentionsService {
  constructor(
    @InjectModel(HistoryAttention.name)
    private readonly historyModel: Model<HistoryAttention>,
  ) {}

  async create(createHistoryAttentionDto: CreateHistoryAttentionDto) {
    const created = new this.historyModel(createHistoryAttentionDto);
    return created.save();
  }

  async findAll() {
    return this.historyModel.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.historyModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`HistoryAttention ${id} no encontrado`);
    return doc;
  }

  async update(id: string, updateHistoryAttentionDto: UpdateHistoryAttentionDto) {
    const updated = await this.historyModel
      .findByIdAndUpdate(id, updateHistoryAttentionDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`HistoryAttention ${id} no encontrado`);
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.historyModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`HistoryAttention ${id} no encontrado`);
    return true;
  }
}
