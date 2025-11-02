import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './schema/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(@InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>) {}

  private async generateNextDoctorId(): Promise<string> {
    const lastDoctor = await this.doctorModel.findOne().sort({ doctor_id: -1 }).exec();
    const lastId = lastDoctor ? parseInt(lastDoctor.doctor_id, 10) : 0;
    const nextId = (lastId + 1).toString().padStart(3, '0');
    return nextId;
  }

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const doctor_id = await this.generateNextDoctorId();

    const createdDoctor = new this.doctorModel({
      ...createDoctorDto,
      doctor_id,
      metadata: { created_by: 'system' },
    });

    return createdDoctor.save();
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorModel.find().exec();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor) throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorModel
      .findByIdAndUpdate(id, updateDoctorDto, { new: true })
      .exec();
    if (!doctor) throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    return doctor;
  }

  async remove(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findByIdAndDelete(id).exec();
    if (!doctor) throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    return doctor;
  }
}
