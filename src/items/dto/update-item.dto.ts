import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-item.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @ApiPropertyOptional({ example: 'TOPOGRAFÍA CORNEAL ANTERIOR' })
  cyclhos_name?: string;

  @ApiPropertyOptional({ example: 'Anterior Corneal Topography' })
  mapped_name?: string;
}
