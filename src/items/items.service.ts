import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemCategory } from './schema/item.schema';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private readonly itemModel: Model<Item>) {}

  private async generateNextItemId(): Promise<string> {
    const lastItem = await this.itemModel.findOne().sort({ item_id: -1 }).exec();
    const lastId = lastItem ? parseInt(lastItem.item_id, 10) : 0;
    const nextId = (lastId + 1).toString().padStart(3, '0');
    return nextId;
  }

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const item_id = await this.generateNextItemId();

    // Generar mapped_name automáticamente si no viene
    const mapped_name =
      createItemDto.mapped_name ||
      createItemDto.cyclhos_name.charAt(0).toUpperCase() +
        createItemDto.cyclhos_name.slice(1).toLowerCase();

    // Asignar categoría por defecto si no viene
    const category = createItemDto.category || ItemCategory.ESTUDIO;

    const newItem = new this.itemModel({
      ...createItemDto,
      mapped_name,
      category,
      item_id,
      metadata: { created_by: 'system' },
    });

    return newItem.save();
  }

  async findAll(): Promise<Item[]> {
    return this.itemModel.find().exec();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemModel.findById(id).exec();
    if (!item) throw new NotFoundException(`Item con ID ${id} no encontrado`);
    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const item = await this.itemModel
      .findByIdAndUpdate(id, updateItemDto, { new: true })
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
