import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateHistoryAttentionDto } from './dto/create-history-attention.dto';
import { UpdateHistoryAttentionDto } from './dto/update-history-attention.dto';
import { HistoryAttention} from './entities/history-attention.schema';
import { Patient } from 'src/patients/schema/patient.schema';

@Injectable()
export class HistoryAttentionsService {
  constructor(
    @InjectModel(HistoryAttention.name)
    private readonly historyModel: Model<HistoryAttention>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<Patient>,
  ) {}

  async create(createHistoryAttentionDto: CreateHistoryAttentionDto) {
    const created = new this.historyModel(createHistoryAttentionDto);
    return created.save();
  }

  async findAll() {
    return this.historyModel.find().exec();
  }

  async findByPatientId(patientId: string) {

  return this.historyModel
    .find({ patient_id: patientId })
    .populate('patient_id', 'fid_number name lastname')
    .populate('doctor_id', 'full_name cyclhos_name')
    .populate('item_id', 'cyclhos_name mapped_name category')
    .exec();
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
