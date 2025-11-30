// src/history-attentions/schema/history-attention.schema.ts
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
export class HistoryAttention extends Document {
  @ApiProperty({ example: '2025-10-30' })
  @Prop({ required: true })
  appointment_date: string;

  @ApiProperty({ example: '14:30' })
  @Prop({ required: true })
  appointment_time: string;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: Patient.name, required: true })
  patient_id: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: Doctor.name, required: true })
  doctor_id: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: Item.name, required: true })
  item_id: Types.ObjectId;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  completed: boolean;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  result_url: string[];

  @ApiProperty({
    example: { sent: true, sent_time: '2025-10-29T14:00:00Z' },
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

  @ApiProperty({ type: String, required: false })
  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  cancelled_id?: Types.ObjectId | null;

  @ApiProperty({
    example: {
      source: 'manual',
      created_at: '2025-10-29T13:00:00Z',
      updated_at: '2025-10-30T08:00:00Z',
    },
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

export const HistoryAttentionSchema =
  SchemaFactory.createForClass(HistoryAttention);
