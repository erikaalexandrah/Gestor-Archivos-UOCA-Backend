import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseArrayPipe, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { DailyPatientsService } from './daily-patients.service';
import { CreateDailyPatientDto } from './dto/create-daily-patient.dto';
import { UpdateDailyPatientDto } from './dto/update-daily-patient.dto';
import { ApiTags, ApiOperation,  ApiParam,  ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { DailyPatient } from './schema/daily-patient.schema';

@ApiTags('daily-patients')
@Controller('daily-patients')
export class DailyPatientsController {
  constructor(private readonly dailyPatientsService: DailyPatientsService) {}

  // ✅ Crear un registro diario (verifica paciente, doctor y item)
  @Post()
  @ApiOperation({
    summary: 'Crear registro diario de paciente',
    description:
      'Crea un nuevo registro diario de paciente asociando paciente, doctor y estudio (item).',
  })
  @ApiBody({ type: CreateDailyPatientDto })
  @ApiResponse({
    status: 201,
    description: 'Registro diario creado correctamente',
    type: DailyPatient,
  })
  @ApiResponse({ status: 400, description: 'Error en la validación de datos' })
  create(@Body() createDailyPatientDto: CreateDailyPatientDto) {
    return this.dailyPatientsService.create(createDailyPatientDto);
  }
  // ✅ Crear múltiples registros diarios de pacientes
  @Post('batch')
  async createBatch(
    @Body(
      new ParseArrayPipe({
        items: CreateDailyPatientDto,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    dtos: CreateDailyPatientDto[],
  ) {
    return await this.dailyPatientsService.createBatch(dtos);
  }



  // ✅ Listar todos los registros diarios con populate
  @Get()
  @ApiOperation({
    summary: 'Listar todos los registros diarios (con populate)',
    description:
      'Obtiene todos los registros diarios de pacientes, incluyendo información del paciente, doctor y estudio asociado.',
  })
  @ApiQuery({
    name: 'completed',
    required: false,
    description: 'Filtra por estado de completado (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros diarios obtenida correctamente',
    type: [DailyPatient],
  })
  findAll() {
  return this.dailyPatientsService.findAll();
  }

  // ✅ Buscar por FID
  @Get('by-fid/:fid_number')
  @ApiOperation({
    summary: 'Buscar registro diario por número de FID',
    description:
      'Permite buscar los registros diarios asociados a un número FID del paciente.',
  })
  @ApiParam({ name: 'fid_number', example: '12345678' })
  @ApiResponse({
    status: 200,
    description: 'Registro diario encontrado',
    type: DailyPatient,
  })
  @ApiResponse({ status: 404, description: 'FID no encontrado' })
  findByFid(@Param('fid_number') fid_number: string) {
    return this.dailyPatientsService.findOne(fid_number);
  }

  // ✅ Buscar por _id
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar registro diario por ID',
    description:
      'Obtiene la información completa de un registro diario de paciente usando su ID en MongoDB.',
  })
  @ApiParam({ name: 'id', example: '6721e2e5f3ab4b1b98d12a30' })
  @ApiResponse({
    status: 200,
    description: 'Registro diario encontrado correctamente',
    type: DailyPatient,
  })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findOne(@Param('id') id: string) {
    return this.dailyPatientsService.findById(id);
  }

  // ✅ Actualizar registro diario
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un registro diario',
    description:
      'Permite actualizar campos específicos del registro diario de paciente (como result_url o estado).',
  })
  @ApiParam({ name: 'id', example: '6721e2e5f3ab4b1b98d12a30' })
  @ApiBody({ type: UpdateDailyPatientDto })
  @ApiResponse({
    status: 200,
    description: 'Registro diario actualizado correctamente',
    type: DailyPatient,
  })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateDailyPatientDto: UpdateDailyPatientDto,
  ) {
    return this.dailyPatientsService.update(id, updateDailyPatientDto);
  }

  @Delete('id/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar registro diario por ID',
    description: 'Elimina un registro diario específico usando su ID MongoDB',
  })
  @ApiParam({ name: 'id', description: 'ID de MongoDB del registro diario', example: '69115851c86e2ab8fadc8b65' })
  @ApiResponse({ status: 204, description: 'Registro eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async removeById(@Param('id') id: string): Promise<void> {
    const result = await this.dailyPatientsService.removeById(id);
    if (!result) {
      // Aquí lanza un error 404 si no se encontró o eliminó
      // Usa NotFoundException o lanzar una excepción personalizada
      throw new NotFoundException(`Registro con id ${id} no encontrado`);
    }
  }
}
