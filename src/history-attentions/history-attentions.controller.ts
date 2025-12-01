import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HistoryAttentionsService } from './history-attentions.service';
import { CreateHistoryAttentionDto } from './dto/create-history-attention.dto';
import { UpdateHistoryAttentionDto } from './dto/update-history-attention.dto';

@Controller('history-attentions')
export class HistoryAttentionsController {
  constructor(private readonly historyAtttentionsService: HistoryAttentionsService) {}

  @Post()
  create(@Body() createHistoryAtttentionDto: CreateHistoryAttentionDto) {
    return this.historyAtttentionsService.create(createHistoryAtttentionDto);
  }

  @Get()
  findAll() {
    return this.historyAtttentionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyAtttentionsService.findOne(id);
  }
  
  @Get('patient/:patientId')
    findByPatientId(@Param('patientId') patientId: string) {
      return this.historyAtttentionsService.findByPatientId(patientId);
   }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHistoryAtttentionDto: UpdateHistoryAttentionDto) {
    return this.historyAtttentionsService.update(id, updateHistoryAtttentionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyAtttentionsService.remove(id);
  }
}
