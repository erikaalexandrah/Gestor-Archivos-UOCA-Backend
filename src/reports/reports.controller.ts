// src/reports/reports.controller.ts
import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('reports')
export class ReportsController {
  private readonly basePath: string;

  constructor() {
    // Usa REPORTS_BASE_PATH del .env
    this.basePath = process.env.REPORTS_BASE_PATH || '';

    if (!this.basePath) {
      console.warn(
        '⚠️ REPORTS_BASE_PATH no está definido. /reports/* no podrá servir archivos.',
      );
    }
  }

  // ✅ Compatible con path-to-regexp nuevo:
  // GET /api/reports/lo/que/sea.pdf  →  *path = "lo/que/sea.pdf"
  @Get('*path')
  async getReport(
    @Param('path') pathParam: string,
    @Res() res: Response,
  ) {
    if (!this.basePath) {
      throw new NotFoundException('Ruta base de informes no configurada');
    }

    // pathParam viene con todo lo que sigue después de /reports/
    // Puede venir con un / inicial, lo quitamos
    const rel = String(pathParam || '').replace(/^\/+/, '');

    // Sanitizar (evitar ../ y normalizar separadores)
    const sanitized = rel.replace(/^\.+/, '').replace(/\\+/g, '/');

    const fullPath = path.join(this.basePath, sanitized);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(
        `Archivo de informe no encontrado: ${sanitized}`,
      );
    }

    return res.sendFile(fullPath);
  }
}
