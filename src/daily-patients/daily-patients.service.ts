import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyPatient } from './schema/daily-patient.schema';
import { CreateDailyPatientDto } from './dto/create-daily-patient.dto';
import { UpdateDailyPatientDto } from './dto/update-daily-patient.dto';
import { Patient } from 'src/patients/schema/patient.schema';
import { Doctor } from 'src/doctors/schema/doctor.schema';
import { Item } from 'src/items/schema/item.schema';
import { PatientsService } from 'src/patients/patients.service';

@Injectable()
export class DailyPatientsService {
  constructor(
    @InjectModel(DailyPatient.name) private readonly dailyModel: Model<DailyPatient>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
    private readonly patientsService: PatientsService,
  ) {}

  async create(dto: CreateDailyPatientDto): Promise<DailyPatient> {
    if (!dto.patient?.fid_number || !dto.doctor?.cyclhos_name || !dto.study?.item) {
      throw new NotFoundException('Datos incompletos en el DTO recibido');
    }

    // Buscar paciente por fid_number
    let patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

    if (!patient) {
      try {
        // Intentar crear paciente
        const patientCreated = await this.patientsService.create({
          fid_number: dto.patient.fid_number,
          name: dto.patient.name,
          lastname: dto.patient.lastname,
          contact_info: {
            email: dto.patient.email || '',
            phone: dto.patient.phone || '',
          },
        } as any);

        // Usar el paciente creado o buscarlo de nuevo
        patient = (patientCreated && (patientCreated as any)._id)
          ? patientCreated as any
          : await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

      } catch (error) {
        // Si ya existe paciente (ConflictException), buscamos el existente
        if (error instanceof ConflictException) {
          patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();
        } else {
          throw error; // Otros errores se lanzan normalmente
        }
      }

      // Validar que paciente exista y tenga _id válido
      if (!patient || !patient._id) {
        throw new NotFoundException(`Paciente con FID ${dto.patient.fid_number} no encontrado después de crearlo`);
      }
    }

    // Buscar doctor
    const doctor = await this.doctorModel.findOne({
      $or: [
        { cyclhos_name: new RegExp(`^${dto.doctor.cyclhos_name}$`, 'i') },
        { full_name: new RegExp(`^${dto.doctor.cyclhos_name}$`, 'i') },
      ],
    }).exec();

    if (!doctor) throw new NotFoundException(`Doctor con nombre "${dto.doctor.cyclhos_name}" no encontrado`);

    // Buscar item (estudio)
    const item = await this.itemModel.findOne({
      $or: [
        { cyclhos_name: new RegExp(`^${dto.study.item}$`, 'i') },
        { mapped_name: new RegExp(`^${dto.study.item}$`, 'i') },
        { category: new RegExp(`^${dto.study.item}$`, 'i') },
      ],
    }).exec();

    if (!item) throw new NotFoundException(`Estudio "${dto.study.item}" no encontrado`);

    // Verificar si ya existe la cita para evitar duplicados
    const existing = await this.dailyModel.findOne({
      patient_id: patient._id,
      doctor_id: doctor._id,
      item_id: item._id,
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
    }).exec();

    if (existing) {
      // Retorna el documento existente sin crear uno nuevo
      return existing;
    }

    // Crear el registro diario
    const created = new this.dailyModel({
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      patient_id: patient._id,
      doctor_id: doctor._id,
      item_id: item._id,
      completed: false,
      result_url: null,
      email_status: { sent: false, sent_time: null },
      metadata: { source: dto.source || 'excel' },
    });

    return created.save();
  }

  async findAll(): Promise<any[]> {
    const records = await this.dailyModel
      .find()
      .populate('patient_id', 'fid_number name lastname contact_info')
      .populate('doctor_id', 'full_name cyclhos_name')
      .populate('item_id', 'cyclhos_name mapped_name category')
      .lean()
      .exec();

    return records.map((record) => ({
      ...record,
      appointment_date: new Date(record.appointment_date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    }));
  }

  async findByFid(fid_number: string): Promise<DailyPatient[]> {
    const records = await this.dailyModel
      .find()
      .populate({ path: 'patient_id', match: { fid_number } })
      .populate('doctor_id', 'full_name cyclhos_name')
      .populate('item_id', 'cyclhos_name mapped_name category')
      .exec();

    const filtered = records.filter((r) => r.patient_id !== null);
    if (!filtered.length) throw new NotFoundException(`No se encontraron citas para FID ${fid_number}`);
    return filtered;
  }

  async findOne(fid_number: string): Promise<DailyPatient[]> {
    return this.findByFid(fid_number);
  }

  async findById(id: string): Promise<DailyPatient> {
    const record = await this.dailyModel
      .findById(id)
      .populate('patient_id', 'fid_number name lastname contact_info')
      .populate('doctor_id', 'full_name cyclhos_name')
      .populate('item_id', 'cyclhos_name mapped_name category')
      .exec();

    if (!record) throw new NotFoundException(`Registro diario con ID ${id} no encontrado`);
    return record;
  }

  async update(id: string, dto: UpdateDailyPatientDto): Promise<DailyPatient> {
    const updated = await this.dailyModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException(`Registro diario con ID ${id} no encontrado`);
    return updated;
  }

  async removeById(id: string): Promise<boolean> {
    const res = await this.dailyModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async createBatch(dtos: CreateDailyPatientDto[]): Promise<any> {
    const createdRecords = [];
    const errors = [];

    for (const dto of dtos) {
      try {
        const created = await this.create(dto);
        createdRecords.push({
          fid_number: dto.patient?.fid_number,
          appointment_date: dto.appointment_date,
          appointment_time: dto.appointment_time,
          _id: created._id,
        });
      } catch (error) {
        errors.push({
          fid_number: dto.patient?.fid_number,
          error: error.message || 'Error desconocido',
        });
      }
    }

    return {
      createdCount: createdRecords.length,
      errorsCount: errors.length,
      createdRecords,
      errors,
    };
  }

}
