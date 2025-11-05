import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from './schema/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
  ) {}

  // 🧩 Crear paciente (usa fid_number como clave única)
  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientModel
      .findOne({ fid_number: createPatientDto.fid_number })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Paciente con FID ${createPatientDto.fid_number} ya existe`,
      );
    }

    const createdPatient = new this.patientModel({
      ...createPatientDto,
      metadata: { created_by: 'system' },
    });

    return createdPatient.save();
  }

  // 🧾 Listar todos los pacientes
  async findAll(): Promise<Patient[]> {
    return this.patientModel.find().exec();
  }

  // 🔍 Buscar por fid_number
  async findByFid(fid_number: string): Promise<Patient> {
    const patient = await this.patientModel.findOne({ fid_number }).exec();
    if (!patient)
      throw new NotFoundException(`Paciente con FID ${fid_number} no encontrado`);
    return patient;
  }

  // ✏️ Actualizar paciente por fid_number
  async updateByFid(
    fid_number: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.patientModel
      .findOneAndUpdate({ fid_number }, updatePatientDto, { new: true })
      .exec();

    if (!patient)
      throw new NotFoundException(`Paciente con FID ${fid_number} no encontrado`);
    return patient;
  }

  // 🗑️ Eliminar paciente por fid_number
  async removeByFid(fid_number: string): Promise<Patient> {
    const patient = await this.patientModel
      .findOneAndDelete({ fid_number })
      .exec();

    if (!patient)
      throw new NotFoundException(`Paciente con FID ${fid_number} no encontrado`);
    return patient;
  }
}
