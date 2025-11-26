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

    const relPath = req.params[0];
    if (!relPath) {
      throw new NotFoundException('Ruta no válida');
    }

    // Evitar traversal y rutas absolutas enviadas por el cliente
    const cleanedRel = relPath.replace(/\0/g, '').replace(/\.\./g, '').replace(/^[\\/]+/, '');

    // Normalizar y resolver absoluto con la base configurada
    const baseResolved = path.resolve(this.basePath);
    const fullPath = path.resolve(baseResolved, cleanedRel);

    // Seguridad: asegurarse que fullPath está dentro de baseResolved
    const baseForCheck = process.platform === 'win32' ? baseResolved.toLowerCase() : baseResolved;
    const fullForCheck = process.platform === 'win32' ? fullPath.toLowerCase() : fullPath;
    if (!fullForCheck.startsWith(baseForCheck + path.sep) && fullForCheck !== baseForCheck) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    console.log('Sirviendo archivo desde:', fullPath);

    // NO pasar { root: '/' } cuando se envía una ruta absoluta en Windows
    return res.sendFile(fullPath);
  }
}
