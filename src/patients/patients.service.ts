import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from './schema/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<Patient>) {}

  private async generateNextPatientId(): Promise<string> {
    const lastPatient = await this.patientModel.findOne().sort({ patient_id: -1 }).exec();
    const lastId = lastPatient ? parseInt(lastPatient.patient_id, 10) : 0;
    const nextId = (lastId + 1).toString().padStart(5, '0');
    return nextId;
  }

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const patient_id = await this.generateNextPatientId();

    const createdPatient = new this.patientModel({
      ...createPatientDto,
      patient_id,
      metadata: { created_by: 'system' },
    });

    return createdPatient.save();
  }

  async findAll(): Promise<Patient[]> {
    return this.patientModel.find().exec();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientModel.findById(id).exec();
    if (!patient) throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.patientModel
      .findByIdAndUpdate(id, updatePatientDto, { new: true })
      .exec();
    if (!patient) throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    return patient;
  }

  async remove(id: string): Promise<Patient> {
    const patient = await this.patientModel.findByIdAndDelete(id).exec();
    if (!patient) throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    return patient;
  }
}
