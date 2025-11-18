import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { SendReportEmailDto } from './dto/send-report-email.dto';

@Controller('technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  /**
   * POST /technician/send-with-file
   * Recibe datos del paciente + lista de rutas lógicas de informes
   * y delega al servicio el envío del correo.
   */
  @Post('send-with-file')
  @HttpCode(HttpStatus.OK)
  async sendWithFile(@Body() dto: SendReportEmailDto) {
    await this.technicianService.sendReportEmail(dto);
    return { ok: true };
  }
}
