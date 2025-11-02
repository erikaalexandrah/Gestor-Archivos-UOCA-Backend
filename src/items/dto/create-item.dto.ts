import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ItemCategory {
  INFORME = 'Informe',
  ESTUDIO = 'Estudio',
}

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
  @IsString()
  mapped_name?: string;

  @ApiProperty({
    example: ItemCategory.ESTUDIO,
    description: 'Categoría del ítem',
    enum: ItemCategory,
  })
  @IsEnum(ItemCategory, { message: 'category debe ser "Informe" o "Estudio"' })
  @IsNotEmpty()
  category: ItemCategory;
}
