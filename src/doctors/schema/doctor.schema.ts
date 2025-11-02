import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
})
export class Doctor extends Document {
  @Prop({ unique: true })
  doctor_id: string;

  @Prop({ required: true })
  fid_number: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  cyclhos_name: string;

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

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
