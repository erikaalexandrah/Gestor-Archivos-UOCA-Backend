import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { SendReportEmailDto } from './dto/send-report-email.dto';
import { DailyPatientsService } from 'src/daily-patients/daily-patients.service';

@Injectable()
export class TechnicianService {
  private readonly logger = new Logger(TechnicianService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly reportsBasePath: string;

  constructor(
    private readonly dailyPatientsService: DailyPatientsService, 
  ) {
    this.reportsBasePath = process.env.REPORTS_BASE_PATH || '';

    if (!this.reportsBasePath) {
      this.logger.warn(
        'REPORTS_BASE_PATH no está definido. No se podrán adjuntar informes.',
      );
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = (process.env.SMTP_SECURE || 'false') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP_HOST / SMTP_USER / SMTP_PASS no están completos en process.env',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendReportEmail(dto: SendReportEmailDto): Promise<void> {
    try {
      const attachments = dto.reportPaths
        .map((relativePath) => {
          const fullPath = path.join(this.reportsBasePath, relativePath);

          if (!fs.existsSync(fullPath)) {
            this.logger.warn(`Archivo no encontrado: ${fullPath}`);
            return null;
          }

          return {
            filename: path.basename(fullPath),
            path: fullPath,
          };
        })
        .filter((att) => att !== null) as { filename: string; path: string }[];

      if (attachments.length === 0) {
        this.logger.warn(
          `No se adjuntó ningún archivo para el envío a ${dto.email}.`,
        );
      }

      const plainText = dto.cuerpo.replace(/<[^>]+>/g, '');

      const fromAddress =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        'no-reply@example.com';

      const info = await this.transporter.sendMail({
        from: `"Informes Clínica" <${fromAddress}>`,
        to: dto.email,
        subject: dto.asunto,
        text: plainText,
        html: dto.cuerpo.includes('<')
          ? dto.cuerpo
          : dto.cuerpo.replace(/\n/g, '<br/>'),
        attachments,
      });

      this.logger.log(
        `Correo enviado a ${dto.email}. messageId=${info.messageId}`,
      );

      // 👇 ACTUALIZACIÓN DE DAILY-PATIENTS CON LOS IDS QUE VIENEN EN EL DTO
      await this.dailyPatientsService.markAsEmailedAndMaybeComplete(
        dto.attentionIds,
        dto.reportPaths,
      );
    } catch (error) {
      this.logger.error('Error enviando correo', error.stack);
      throw new InternalServerErrorException('Error enviando correo');
    }
  }
}
