import { IsString, IsNotEmpty, IsEnum, IsOptional, IsMongoId, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemCategory } from '../schema/item.schema';

export class CreateItemDto {
  @ApiProperty({ example: 'TOPOGRAFÍA CORNEAL' })
  @IsString()
  @IsNotEmpty()
  cyclhos_name: string;

  @ApiProperty({
    example: 'Topografía corneal',
    description:
      'Nombre legible del estudio (si no se envía, se genera automáticamente desde cyclhos_name)',
    required: false,
  })
  @IsOptional()
  @IsString()
  mapped_name?: string;

  @ApiProperty({
    example: '',
    description: 'Ruta o identificador del archivo asociado (opcional).',
    required: false,
  })
  @IsOptional()
  @IsString()
  file?: string;

  @ApiProperty({
    example: 2,
    description: 'Número de PDFs. Si no se envía, se calcula desde pdf_type.length.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  number_pdf?: number;

  @ApiProperty({
    example: ['69113aa8b4f73f838b368c87', '69113b6eb4f73f838b368cb3'],
    description: 'Arreglo de ObjectId (strings) que referencian otros ítems (subitems / combo).',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  pdf_type?: string[];

  @ApiProperty({
    example: ItemCategory.ESTUDIO,
    description: 'Categoría del ítem',
    enum: ItemCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(ItemCategory, { message: 'category debe ser "Informe" o "Estudio"' })
  category?: ItemCategory;
}
