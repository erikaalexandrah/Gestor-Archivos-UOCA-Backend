import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Item } from './schema/item.schema';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // ✅ Crear un nuevo ítem
  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo ítem',
    description: 'Crea un nuevo estudio o informe. La categoría solo puede ser "Informe" o "Estudio".',
  })
  @ApiResponse({
    status: 201,
    description: 'Ítem creado exitosamente',
    type: Item,
  })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  // ✅ Obtener todos los ítems
  @Get()
  @ApiOperation({
    summary: 'Listar todos los ítems',
    description: 'Obtiene la lista completa de ítems disponibles en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ítems obtenida correctamente',
    type: [Item],
  })
  findAll() {
    return this.itemsService.findAll();
  }

  // ✅ Obtener un ítem por su ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ítem por ID' })
  @ApiParam({ name: 'id', example: '672271f37ad6eae780b43a99' })
  @ApiResponse({
    status: 200,
    description: 'Ítem encontrado correctamente',
    type: Item,
  })
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  // ✅ Actualizar un ítem por ID
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ítem por ID' })
  @ApiParam({ name: 'id', example: '672271f37ad6eae780b43a99' })
  @ApiResponse({
    status: 200,
    description: 'Ítem actualizado correctamente',
    type: Item,
  })
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  // ✅ Eliminar un ítem por ID
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un ítem por ID' })
  @ApiParam({ name: 'id', example: '672271f37ad6eae780b43a99' })
  @ApiResponse({
    status: 200,
    description: 'Ítem eliminado correctamente',
    type: Item,
  })
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
