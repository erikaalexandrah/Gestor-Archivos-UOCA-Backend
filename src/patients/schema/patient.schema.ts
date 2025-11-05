import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
})
export class Patient extends Document {
  @Prop({ required: true, unique: true })
  fid_number: string; // Cédula (ID natural del paciente)

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({
    type: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
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
