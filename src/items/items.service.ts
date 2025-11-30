import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from './schema/item.schema';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private readonly itemModel: Model<Item>) {}

  private async generateNextItemId(): Promise<string> {
    const count = await this.itemModel.countDocuments().exec();
    const next = count + 1;
    return next.toString().padStart(4, '0'); // 0001, 0002, etc.
  }

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const item_id = await this.generateNextItemId();

    // Generar mapped_name automáticamente si no viene
    const mapped_name =
      createItemDto.mapped_name ||
      createItemDto.cyclhos_name.charAt(0).toUpperCase() +
        createItemDto.cyclhos_name.slice(1).toLowerCase();

    // Asignar categoría por defecto si no viene
    const category = createItemDto.category || Item.prototype['category'] || 'Estudio';

    // Validar pdf_type (si viene): que los ids existan
    if (createItemDto.pdf_type && createItemDto.pdf_type.length > 0) {
      // Convertir a ObjectId (mongoose castea strings a ObjectId, pero chequeamos existencia)
      const count = await this.itemModel.countDocuments({ _id: { $in: createItemDto.pdf_type } }).exec();
      if (count !== createItemDto.pdf_type.length) {
        throw new BadRequestException('Alguno(s) de los ids en pdf_type no existen');
      }
    }

    // Calcular number_pdf si no viene
    const number_pdf = typeof createItemDto.number_pdf === 'number'
      ? createItemDto.number_pdf
      : (createItemDto.pdf_type ? createItemDto.pdf_type.length : 0);

    const newItem = new this.itemModel({
      ...createItemDto,
      mapped_name,
      category,
      item_id,
      file: createItemDto.file || '',
      number_pdf,
      pdf_type: createItemDto.pdf_type || [],
      metadata: { created_by: 'system' },
    });

    return newItem.save();
  }

 private normalizeName(text: string = ""): string {
    if (!text) return "";

    // Solo considerar ALL CAPS si:
    // 1) Solo hay letras (incluyendo acentos y Ñ), números, espacios y signos comunes
    // 2) Es igual a su propia versión en mayúsculas locales
    const allowed = /^[A-ZÁÉÍÓÚÜÑ0-9\s().\-]+$/u;
    const isAllUpper =
      allowed.test(text) && text === text.toLocaleUpperCase("es-ES");

    // Si NO es ALL CAPS, se respeta tal cual viene de la BD
    if (!isAllUpper) return text;

    // Solo aquí pasamos de ALL CAPS → Title Case
    return text
      .toLocaleLowerCase("es-ES")
      .split(/(\s+)/)
      .map((word) => {
        if (!word.trim()) return word;
        return word.charAt(0).toLocaleUpperCase("es-ES") + word.slice(1);
      })
      .join("");
  }

  async findAll(): Promise<Item[]> {
    const items = await this.itemModel.find().populate('pdf_type').exec();

    return items.map((item) => {
      const obj = item.toObject();

      obj.mapped_name = this.normalizeName(obj.mapped_name);
      obj.cyclhos_name = this.normalizeName(obj.cyclhos_name);

      return obj;
    });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemModel.findById(id).populate('pdf_type').exec();
    if (!item) throw new NotFoundException(`Item con ID ${id} no encontrado`);

    const obj = item.toObject();
    obj.mapped_name = this.normalizeName(obj.mapped_name);
    obj.cyclhos_name = this.normalizeName(obj.cyclhos_name);

    return obj;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    // Si actualizan pdf_type: validar que los ids existan
    if (updateItemDto.pdf_type && updateItemDto.pdf_type.length > 0) {
      const count = await this.itemModel.countDocuments({ _id: { $in: updateItemDto.pdf_type } }).exec();
      if (count !== updateItemDto.pdf_type.length) {
        throw new BadRequestException('Alguno(s) de los ids en pdf_type no existen');
      }
      // si number_pdf no fue enviado, lo calculamos
      if (typeof updateItemDto.number_pdf !== 'number') {
        updateItemDto.number_pdf = updateItemDto.pdf_type.length;
      }
    }

    // Si se actualiza cyclhos_name pero no mapped_name, generamos mapped_name automáticamente
    if (updateItemDto.cyclhos_name && typeof updateItemDto.mapped_name === 'undefined') {
      const lower = updateItemDto.cyclhos_name.toLowerCase();
      updateItemDto.mapped_name = lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    const item = await this.itemModel
      .findByIdAndUpdate(id, updateItemDto, { new: true })
      .populate('pdf_type')
      .exec();

    if (!item) throw new NotFoundException(`Item con ID ${id} no encontrado`);
    return item;
  }

  async remove(id: string): Promise<Item> {
    const item = await this.itemModel.findByIdAndDelete(id).exec();
    if (!item) throw new NotFoundException(`Item con ID ${id} no encontrado`);
    return item;
  }
}
