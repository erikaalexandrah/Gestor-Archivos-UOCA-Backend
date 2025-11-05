import { Injectable, NotFoundException } from '@nestjs/common';
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

  // 🧠 Crear un registro diario
  async create(dto: CreateDailyPatientDto): Promise<DailyPatient> {
    // 🔎 1️⃣ Validar datos esenciales
    if (!dto.patient?.fid_number || !dto.doctor?.cyclhos_name || !dto.study?.item) {
      throw new NotFoundException('Datos incompletos en el DTO recibido');
    }

    // 👤 2️⃣ Buscar o crear paciente por fid_number
    let patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

    if (!patient) {
      console.log(`👤 Paciente nuevo detectado [FID: ${dto.patient.fid_number}] → creando...`);

      await this.patientsService.create({
        fid_number: dto.patient.fid_number,
        name: dto.patient.name,
        lastname: dto.patient.lastname,
        contact_info: {
          email: dto.patient.email || '',
          phone: dto.patient.phone || '',
        },
      } as any);

      patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

      if (!patient) {
        throw new NotFoundException(`Paciente con FID ${dto.patient.fid_number} no encontrado después de crearlo`);
      }
    }

    // 👩‍⚕️ 3️⃣ Buscar doctor de forma flexible
    const doctor = await this.doctorModel.findOne({
      $or: [
        { cyclhos_name: new RegExp(`^${dto.doctor.cyclhos_name}$`, 'i') },
        { full_name: new RegExp(`^${dto.doctor.cyclhos_name}$`, 'i') },
      ],
    }).exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor con nombre "${dto.doctor.cyclhos_name}" no encontrado`);
    }

    // 🧪 4️⃣ Buscar item (estudio) de forma flexible
    const item = await this.itemModel.findOne({
      $or: [
        { cyclhos_name: new RegExp(`^${dto.study.item}$`, 'i') },
        { mapped_name: new RegExp(`^${dto.study.item}$`, 'i') },
        { category: new RegExp(`^${dto.study.item}$`, 'i') },
      ],
    }).exec();

    if (!item) {
      throw new NotFoundException(`Estudio "${dto.study.item}" no encontrado`);
    }

    // 💾 5️⃣ Crear registro diario con referencias reales
    const created = new this.dailyModel({
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      patient_id: patient._id, // referencia al paciente
      doctor_id: doctor._id,
      item_id: item._id,
      completed: false,
      result_url: null,
      email_status: { sent: false, sent_time: null },
      metadata: { source: dto.source || 'excel' },
    });

    return created.save();
  }

  // 📋 Listar todos los registros
  async findAll(): Promise<any[]> {
    const records = await this.dailyModel
      .find()
      .populate({
        path: 'patient_id',
        select: 'fid_number name lastname contact_info',
      })
      .populate({
        path: 'doctor_id',
        select: 'full_name cyclhos_name',
      })
      .populate({
        path: 'item_id',
        select: 'cyclhos_name mapped_name category',
      })
      .lean()
      .exec();

    // 🧠 Formatear fecha en formato legible
    return records.map((record) => ({
      ...record,
      appointment_date: new Date(record.appointment_date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    }));
  }

  // 🔍 Buscar registros por FID
  async findByFid(fid_number: string): Promise<DailyPatient[]> {
    const records = await this.dailyModel
      .find()
      .populate({
        path: 'patient_id',
        match: { fid_number },
        select: 'fid_number name lastname contact_info',
      })
      .populate({
        path: 'doctor_id',
        select: 'full_name cyclhos_name',
      })
      .populate({
        path: 'item_id',
        select: 'cyclhos_name mapped_name category',
      })
      .exec();

    const filtered = records.filter((r) => r.patient_id !== null);
    if (!filtered.length)
      throw new NotFoundException(`No se encontraron citas para el paciente con FID ${fid_number}`);
    return filtered;
  }

  // 🔍 Buscar registro por ID
  async findById(id: string): Promise<DailyPatient> {
    const record = await this.dailyModel
      .findById(id)
      .populate({
        path: 'patient_id',
        select: 'fid_number name lastname contact_info',
      })
      .populate({
        path: 'doctor_id',
        select: 'full_name cyclhos_name',
      })
      .populate({
        path: 'item_id',
        select: 'cyclhos_name mapped_name category',
      })
      .exec();

    if (!record)
      throw new NotFoundException(`Registro diario con ID ${id} no encontrado`);

    return record;
  }

  // ✏️ Actualizar
  async update(id: string, dto: UpdateDailyPatientDto): Promise<DailyPatient> {
    const updated = await this.dailyModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated)
      throw new NotFoundException(`Registro diario con ID ${id} no encontrado`);
    return updated;
  }

  // 🗑️ Eliminar por FID + item
  async remove(fid_number: string, item_name: string): Promise<DailyPatient> {
    const patient = await this.patientModel.findOne({ fid_number }).exec();
    if (!patient) throw new NotFoundException(`Paciente con FID ${fid_number} no encontrado`);

    const item = await this.itemModel
      .findOne({
        $or: [{ cyclhos_name: item_name }, { mapped_name: item_name }],
      })
      .exec();

    if (!item)
      throw new NotFoundException(`Estudio con nombre ${item_name} no encontrado`);

    const deleted = await this.dailyModel
      .findOneAndDelete({
        patient_id: patient._id,
        item_id: item._id,
      })
      .exec();

    if (!deleted)
      throw new NotFoundException(
        `No se encontró registro diario para FID ${fid_number} con el estudio ${item_name}`,
      );

    return deleted;
  }

  // ⚡ Crear múltiples registros (batch)
  async createBatch(dtos: CreateDailyPatientDto[]): Promise<DailyPatient[]> {
    const results: DailyPatient[] = [];

    for (const dto of dtos) {
      try {
        const created = await this.create(dto);
        results.push(created);
      } catch (error) {
        console.error(`❌ Error creando registro para paciente FID ${dto.patient?.fid_number}:`, error.message);
      }
    }

    return results;
  }
}
