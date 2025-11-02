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
    private readonly patientsService: PatientsService, // ✅ se inyecta para crear pacientes correctamente
  ) {}

  async create(dto: CreateDailyPatientDto): Promise<DailyPatient> {
    // 🧍 1️⃣ Verificar si el paciente existe por FID
    let patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

    if (!patient) {
      // Si no existe, crearlo correctamente usando PatientsService
      // Primero crear con el servicio (puede devolver un tipo plain Patient)
      await this.patientsService.create({
        fid_number: dto.patient.fid_number,
        name: dto.patient.name,
        lastname: dto.patient.lastname,
        contact_info: {
          email: dto.patient.email,
          phone: dto.patient.phone,
        },
      } as any);

      // Luego reconsultar el modelo Mongoose para obtener el Document con _id y métodos de mongoose
      patient = await this.patientModel.findOne({ fid_number: dto.patient.fid_number }).exec();

      if (!patient) {
        throw new NotFoundException(
          `Paciente con FID ${dto.patient.fid_number} no encontrado después de crearlo`,
        );
      }
    }

    // 👩‍⚕️ 2️⃣ Buscar doctor por cyclhos_name
    const doctor = await this.doctorModel.findOne({
      cyclhos_name: dto.doctor.cyclhos_name,
    }).exec();

    if (!doctor)
      throw new NotFoundException(
        `Doctor con cyclhos_name "${dto.doctor.cyclhos_name}" no encontrado`,
      );

    // 🧪 3️⃣ Buscar item (estudio)
    const item = await this.itemModel.findOne({
      cyclhos_name: dto.study.item,
    }).exec();

    if (!item)
      throw new NotFoundException(`Estudio "${dto.study.item}" no encontrado`);

    // 💾 4️⃣ Crear registro diario
    const created = new this.dailyModel({
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      patient_id: patient._id, // ✅ usa _id real del documento paciente
      doctor_id: doctor._id,   // ✅ usa _id real del documento doctor
      item_id: item._id,       // ✅ usa _id real del documento item
      completed: false,
      result_url: null,
      email_status: { sent: false, sent_time: null },
      metadata: { source: dto.source || 'manual' },
    });

    return created.save();
  }

  // ✅ Listar todos los registros diarios
  async findAll(): Promise<DailyPatient[]> {
    return this.dailyModel
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
      .exec();
  }

  // ✅ Buscar registros por FID del paciente
  async findOne(fid_number: string): Promise<DailyPatient[]> {
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

  // ✅ Buscar un registro diario por su ID
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

  // ✅ Actualizar registro diario
  async update(id: string, dto: UpdateDailyPatientDto): Promise<DailyPatient> {
    const updated = await this.dailyModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated)
      throw new NotFoundException(`Registro diario con ID ${id} no encontrado`);
    return updated;
  }

  // ✅ Eliminar registro diario por FID + item_name
  async remove(fid_number: string, item_name: string): Promise<DailyPatient> {
    // 1️⃣ Buscar el paciente por FID
    const patient = await this.patientModel.findOne({ fid_number }).exec();
    if (!patient) {
      throw new NotFoundException(`Paciente con FID ${fid_number} no encontrado`);
    }

    // 2️⃣ Buscar el item por nombre (puede ser cyclhos_name o mapped_name)
    const item = await this.itemModel
      .findOne({
        $or: [{ cyclhos_name: item_name }, { mapped_name: item_name }],
      })
      .exec();

    if (!item) {
      throw new NotFoundException(`Estudio con nombre ${item_name} no encontrado`);
    }

    // 3️⃣ Eliminar el registro diario correspondiente
    const deleted = await this.dailyModel
      .findOneAndDelete({
        patient_id: patient._id,
        item_id: item._id,
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException(
        `No se encontró registro diario para FID ${fid_number} con el estudio ${item_name}`,
      );
    }

    return deleted;
  }

  // ✅ Crear múltiples registros diarios (batch)
  async createBatch(dtos: CreateDailyPatientDto[]): Promise<DailyPatient[]> {
    const results: DailyPatient[] = [];

    for (const dto of dtos) {
      try {
        // Reutilizamos el método create existente para mantener la lógica de validación
        const created = await this.create(dto);
        results.push(created);
      } catch (error) {
        console.error(`❌ Error creando registro para paciente FID ${dto.patient?.fid_number}:`, error.message);
      }
    }

    return results;
  }

}
