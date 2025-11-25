// src/reports/reports.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('reports')
export class ReportsController {
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.REPORTS_BASE_PATH || '';
    if (!this.basePath) {
      console.warn('⚠️ REPORTS_BASE_PATH no está definido.');
    }
  }

  /**
   * Captura cualquier ruta después de /reports/**
   * Ejemplo:
   *   GET /reports/paciente/123/archivo.pdf
   * req.params[0] → "paciente/123/archivo.pdf"
   */
  @Get('*')
  async getReport(@Req() req: Request, @Res() res: Response) {
    if (!this.basePath) {
      throw new NotFoundException('Ruta base no configurada');
    }

    // ⭐ req.params[0] es la parte capturada por *
    const relPath = req.params[0];

    if (!relPath) {
      throw new NotFoundException('Ruta no válida');
    }

    // Limpieza básica
    const clean = relPath.replace(/\.\./g, '');

    const fullPath = path.join(this.basePath, clean);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.sendFile(fullPath, { root: '/' });
  }
}
