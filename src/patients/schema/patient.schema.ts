import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
})
export class Patient extends Document {
  @Prop({ unique: true })
  patient_id: string;

  @Prop({ required: true })
  fid_number: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({
    type: {
      email: { type: String },
      phone: { type: String },
    },
    required: true,
  })
  contact_info: {
    email: string;
    phone: string;
  };

  @Prop({
    type: {
      created_at: { type: Date },
      updated_at: { type: Date },
      created_by: { type: String, default: 'system' },
    },
    default: {},
  })
  metadata: {
    created_at: Date;
    updated_at: Date;
    created_by: string;
  };
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
