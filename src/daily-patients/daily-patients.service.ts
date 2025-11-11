// daily-patients.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
        // Intentar crear paciente usando PatientsService (manteniendo tu lógica)
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
          ? (patientCreated as any)
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

    // Crear el registro diario con los defaults definidos:
    // - completed: false
    // - result_url: arreglo vacío []
    // - email_status: anidado { sent: false, sent_time: null }
    // - cancelled_id: null (no se provee al crear)
    const created = new this.dailyModel({
      appointment_date: dto.appointment_date,
      appointment_time: dto.appointment_time,
      patient_id: patient._id,
      doctor_id: doctor._id,
      item_id: item._id,
      completed: false,
      result_url: [], // <-- cambiado a arreglo vacío por defecto
      email_status: { sent: false, sent_time: null }, // <-- mantenido anidado
      cancelled_id: null, // <-- por defecto
      metadata: { source: dto.source || 'excel' },
    });

    return created.save();
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

// Devuelve resumen agregado de TODOS los registros actualmente en la colección.
// Cada item: { name, lastname, fid_number, status, appointment_date }
// Reglas de status:
// - "enviado"              => todas las atenciones del paciente tienen completed === true
// - "pendiente por enviar" => existe al menos 1 result_url (size>0) y no todos los registros están sent (email_status.sent)
// - "no enviado"           => no hay result_url ni envíos

// En DailyPatientsService (TypeScript)
async getSummarizedAll(): Promise<
  Array<{
    patient_id: string | null;
    name: string;
    lastname: string;
    fid_number: string;
    status: 'no enviado' | 'pendiente por enviar' | 'enviado';
    appointment_date: string | null;
  }>
> {
  const pipeline = [
    {
      $lookup: {
        from: 'patients',
        localField: 'patient_id',
        foreignField: '_id',
        as: 'patient',
      },
    },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: false } },

    {
      $group: {
        _id: '$patient._id',
        appointment_date: { $first: '$appointment_date' },
        fid_number: { $first: '$patient.fid_number' },
        name: { $first: '$patient.name' },
        lastname: { $first: '$patient.lastname' },

        totalCount: { $sum: 1 },

        completedCount: {
          $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] },
        },

        hasResultCount: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$result_url', []] } }, 0] },
              1,
              0,
            ],
          },
        },

        sentCount: {
          $sum: {
            $cond: [{ $eq: [{ $ifNull: ['$email_status.sent', false] }, true] }, 1, 0],
          },
        },
      },
    },

    {
      $project: {
        _id: 0,
        patient_id: '$_id',       // <-- proyectamos el _id del paciente
        fid_number: 1,
        name: 1,
        lastname: 1,
        appointment_date: 1,
        totalCount: 1,
        completedCount: 1,
        hasResultCount: 1,
        sentCount: 1,
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$completedCount', '$totalCount'] }, then: 'enviado' },
              {
                case: {
                  $and: [
                    { $gt: ['$hasResultCount', 0] },
                    { $lt: ['$sentCount', '$totalCount'] },
                  ],
                },
                then: 'pendiente por enviar',
              },
            ],
            default: 'no enviado',
          },
        },
      },
    },
  ];

  const results = await this.dailyModel.aggregate(pipeline).exec();

  return results.map((r: any) => ({
    patient_id: r.patient_id ? String(r.patient_id) : null,
    name: r.name ?? '',
    lastname: r.lastname ?? '',
    fid_number: r.fid_number ?? '',
    status: (r.status as 'no enviado' | 'pendiente por enviar' | 'enviado') ?? 'no enviado',
    appointment_date: r.appointment_date ?? null,
  }));
}

/**
 * Resumen por paciente:
 * - Busca en dailyPatients todos los registros para el patientId dado
 * - Devuelve info básica del paciente + items únicos (id + mapped_name) + doctors únicos (id + full_name)
 */
async getPatientSummaryById(patientId: string): Promise<{
  patient_id: string;
  name: string;
  lastname: string;
  fid_number: string;
  email?: string | null;
  phone?: string | null;
  items: Array<{ item_id: string; mapped_name?: string | null }>;
  doctors: Array<{ doctor_id: string; full_name?: string | null }>;
  total_attentions: number;
}> {
  // Validar ObjectId
  if (!patientId || !Types.ObjectId.isValid(patientId)) {
    throw new NotFoundException('ID de paciente inválido');
  }
  const pid = new Types.ObjectId(patientId);

  const pipeline = [
    // Filtrar por patient_id en dailyPatients
    { $match: { patient_id: pid } },

    // Traer documento paciente
    {
      $lookup: {
        from: 'patients',
        localField: 'patient_id',
        foreignField: '_id',
        as: 'patient',
      },
    },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: false } },

    // Agrupar por paciente para obtener conjuntos únicos de items y doctors
    {
      $group: {
        _id: '$patient._id',
        fid_number: { $first: '$patient.fid_number' },
        name: { $first: '$patient.name' },
        lastname: { $first: '$patient.lastname' },

        // intentar tomar email/phone del root o de contact_info (compatibilidad)
        email: { $first: { $ifNull: ['$patient.email', '$patient.contact_info.email'] } },
        phone: { $first: { $ifNull: ['$patient.phone', '$patient.contact_info.phone'] } },

        items: { $addToSet: '$item_id' },
        doctors: { $addToSet: '$doctor_id' },

        total_attentions: { $sum: 1 },
      },
    },

    // Obtener info completa de items (mapped_name) para los item ids recogidos
    {
      $lookup: {
        from: 'items',
        localField: 'items',
        foreignField: '_id',
        as: 'items_info',
      },
    },

    // Obtener info completa de doctors (full_name) para los doctor ids recogidos
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctors',
        foreignField: '_id',
        as: 'doctors_info',
      },
    },

    // Proyectar la respuesta en la forma deseada
    {
      $project: {
        _id: 0,
        patient_id: { $toString: '$_id' },
        fid_number: 1,
        name: 1,
        lastname: 1,
        email: 1,
        phone: 1,
        total_attentions: 1,

        // mapear items_info a { item_id, mapped_name }
        items: {
          $map: {
            input: '$items_info',
            as: 'it',
            in: {
              item_id: { $toString: '$$it._id' },
              mapped_name: { $ifNull: ['$$it.mapped_name', '$$it.name', null] },
            },
          },
        },

        // mapear doctors_info a { doctor_id, full_name }
        doctors: {
          $map: {
            input: '$doctors_info',
            as: 'd',
            in: {
              doctor_id: { $toString: '$$d._id' },
              full_name: { $ifNull: ['$$d.full_name', '$$d.cyclhos_name', null] },
            },
          },
        },
      },
    },
  ];

  const agg = await this.dailyModel.aggregate(pipeline).exec();

  if (!agg || !agg.length) {
    throw new NotFoundException(`No se encontraron atenciones para el paciente ${patientId}`);
  }

  const r = agg[0];

  return {
    patient_id: r.patient_id,
    name: r.name ?? '',
    lastname: r.lastname ?? '',
    fid_number: r.fid_number ?? '',
    email: r.email ?? null,
    phone: r.phone ?? null,
    items: Array.isArray(r.items) ? r.items : [],
    doctors: Array.isArray(r.doctors) ? r.doctors : [],
    total_attentions: r.total_attentions ?? 0,
  };
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

 
}
