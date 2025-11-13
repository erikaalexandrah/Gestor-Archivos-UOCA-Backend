import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ItemCategory {
  INFORME = 'Informe',
  ESTUDIO = 'Estudio',
}

@Schema({
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
})
export class Item extends Document {
  @Prop({ unique: true })
  item_id: string;

  @Prop({ required: true })
  cyclhos_name: string;

  @Prop({
    required: true,
    set: (value: string, doc: Item) => {
      // Si se envía manualmente, lo toma; si no, lo genera desde cyclhos_name
      if (value) return value;
      if (doc?.cyclhos_name) {
        const lower = doc.cyclhos_name.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return '';
    },
  })
  mapped_name: string;

  @Prop({
    required: true,
    enum: Object.values(ItemCategory),
    default: ItemCategory.ESTUDIO,
  })
  category: ItemCategory;

  // Nuevo: ruta/identificador de archivo (puede ser string vacío)
  @Prop({ type: String, default: '' })
  file: string;

  // Nuevo: número de pdfs (se puede calcular desde pdf_type)
  @Prop({ type: Number, default: 0 })
  number_pdf: number;

  // Nuevo: arreglo de ObjectId referenciando otros Items (subitems / combo)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Item' }], default: [] })
  pdf_type: Types.ObjectId[];

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

export const ItemSchema = SchemaFactory.createForClass(Item);

// Hook: autogenera mapped_name si no se envía manualmente
ItemSchema.pre<Item>('save', function (next) {
  if (!this.mapped_name && this.cyclhos_name) {
    const lower = this.cyclhos_name.toLowerCase();
    this.mapped_name = lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  // Si pdf_type está presente y number_pdf no fue seteado manualmente, lo calculamos
  if ((this.isNew || this.isModified('pdf_type')) && (!this.number_pdf || this.number_pdf === 0)) {
    this.number_pdf = Array.isArray(this.pdf_type) ? this.pdf_type.length : 0;
  }

  next();
});
