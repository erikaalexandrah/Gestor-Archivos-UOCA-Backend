import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from 'src/patients/schema/patient.schema';
import { Doctor } from 'src/doctors/schema/doctor.schema';
import { Item } from 'src/items/schema/item.schema';
import { User } from 'src/auth/schema/user.schema';

@Schema({
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
})
export class DailyPatient extends Document {
  @ApiProperty({ example: '2025-10-30', description: 'Fecha de la cita del paciente' })
  @Prop({ required: true })
  appointment_date: string;

  @ApiProperty({ example: '14:30', description: 'Hora programada de la cita' })
  @Prop({ required: true })
  appointment_time: string;

  @ApiProperty({ type: String, description: 'ID del paciente (referencia al modelo Patient)' })
  @Prop({ type: Types.ObjectId, ref: Patient.name, required: true })
  patient_id: Types.ObjectId;

  @ApiProperty({ type: String, description: 'ID del doctor asignado (referencia al modelo Doctor)' })
  @Prop({ type: Types.ObjectId, ref: Doctor.name, required: true })
  doctor_id: Types.ObjectId;

  @ApiProperty({ type: String, description: 'ID del ítem o tratamiento asociado (referencia al modelo Item)' })
  @Prop({ type: Types.ObjectId, ref: Item.name, required: true })
  item_id: Types.ObjectId;

  @ApiProperty({ example: false, description: 'Indica si la cita ya fue completada' })
  @Prop({ default: false })
  completed: boolean;

  @ApiProperty({
    example: ['\\\\servidor\\resultados\\paciente123.pdf', '\\\\servidor\\resultados\\paciente123_extra.pdf'],
    description: 'Arreglo de rutas Windows donde se guardó el/los pdf(s)',
  })
  @Prop({ type: [String], default: [] })
  result_url: string[];

  @ApiProperty({
    example: { sent: true, sent_time: '2025-10-29T14:00:00Z' },
    description: 'Estado del correo enviado al paciente',
  })
  @Prop({
    type: {
      sent: { type: Boolean, default: false },
      sent_time: { type: Date, default: null },
    },
    default: {},
  })
  email_status: {
    sent: boolean;
    sent_time: Date | null;
  };

  @ApiProperty({ example: '60f7c0a1b3e2f7001a2b3c4d', description: 'ID del usuario que canceló este item (si aplica)' })
  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  cancelled_id?: Types.ObjectId | null;

  @ApiProperty({
    example: {
      source: 'manual',
      created_at: '2025-10-29T13:00:00Z',
      updated_at: '2025-10-30T08:00:00Z',
    },
    description: 'Información de auditoría y fuente de creación',
  })
  @Prop({
    type: {
      source: { type: String, enum: ['excel', 'manual'], default: 'manual' },
      created_at: { type: Date },
      updated_at: { type: Date },
    },
    default: {},
  })
  metadata: {
    source: string;
    created_at: Date;
    updated_at: Date;
  };
}

export const DailyPatientSchema = SchemaFactory.createForClass(DailyPatient);
