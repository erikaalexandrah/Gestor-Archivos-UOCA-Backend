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
  private readonly reportsBasePaths: string[];

  constructor(
    private readonly dailyPatientsService: DailyPatientsService, 
  ) {
    const raw = process.env.REPORTS_BASE_PATH || '';
    this.reportsBasePaths = raw
      .split(/[;,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          s = s.slice(1, -1);
        }
        return path.normalize(s);
      });

    if (this.reportsBasePaths.length === 0) {
      this.logger.warn(
        'REPORTS_BASE_PATH no está definido. No se podrán adjuntar informes.',
      );
    } else {
      this.logger.log(`REPORTS_BASE_PATHS=${JSON.stringify(this.reportsBasePaths)}`);
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

  private async existsAsync(p: string) {
    try {
      await fs.promises.access(p, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async findInSubdirs(root: string, targetName: string, maxDepth = 6, maxDirs = 2000) {
    const queue: { dir: string; depth: number }[] = [{ dir: root, depth: 0 }];
    let visitedDirs = 0;
    while (queue.length) {
      const { dir, depth } = queue.shift()!;
      if (++visitedDirs > maxDirs) break;
      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isFile() && e.name === targetName) return p;
        if (e.isDirectory() && depth < maxDepth) queue.push({ dir: p, depth: depth + 1 });
      }
    }
    return null;
  }

  // Busca el archivo relativo en todas las bases configuradas
  private async findFileAcrossBases(relativePath: string) {
    const cleanedRel = relativePath.replace(/\0/g, '').replace(/\.\./g, '').replace(/^[\\/]+/, '');
    const filename = path.basename(cleanedRel);

    for (const base of this.reportsBasePaths) {
      const candidate = path.join(base, cleanedRel);

      if (await this.existsAsync(candidate)) {
        // seguridad: comprobar que candidate está dentro de base
        const relative = path.relative(base, candidate);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          return candidate;
        }
      }

      // buscar en subcarpetas por nombre
      const found = await this.findInSubdirs(base, filename);
      if (found) {
        const relativeFound = path.relative(base, found);
        if (!relativeFound.startsWith('..') && !path.isAbsolute(relativeFound)) {
          this.logger.log(`Archivo encontrado en base ${base}: ${found}`);
          return found;
        }
      }
    }

    return null;
  }

  async sendReportEmail(dto: SendReportEmailDto): Promise<void> {
    try {
      const attachments = await Promise.all(
        (dto.reportPaths || []).map(async (relativePath) => {
          const fullPath = await this.findFileAcrossBases(relativePath);

          if (!fullPath) {
            this.logger.warn(`Archivo no encontrado para '${relativePath}' en ninguna base.`);
            return null;
          }

          return {
            filename: path.basename(fullPath),
            path: fullPath,
          };
        }),
      ).then((arr) => arr.filter((a) => a !== null) as { filename: string; path: string }[]);

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

      await this.dailyPatientsService.markAsEmailedAndMaybeComplete(
        dto.attentionIds,
        dto.reportPaths,
      );
    } catch (error) {
      this.logger.error('Error enviando correo', (error as Error).stack);
      throw new InternalServerErrorException('Error enviando correo');
    }
  }
}
