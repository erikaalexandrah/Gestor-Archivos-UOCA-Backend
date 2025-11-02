import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

// 🧠 Hook: autogenera mapped_name si no se envía manualmente
ItemSchema.pre<Item>('save', function (next) {
  if (!this.mapped_name && this.cyclhos_name) {
    const lower = this.cyclhos_name.toLowerCase();
    this.mapped_name = lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  next();
});
