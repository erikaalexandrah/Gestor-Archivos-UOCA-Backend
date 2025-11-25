// src/reports/reports.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  private readonly basePath = process.env.REPORTS_BASE_PATH || '';

  getFileFullPath(relPath: string): string {
    if (!this.basePath) {
      throw new NotFoundException('Ruta base no configurada');
    }

    // Sanitizar
    const cleanPath = relPath.replace(/\.\./g, '');
    const fullPath = path.join(this.basePath, cleanPath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`Archivo no encontrado: ${cleanPath}`);
    }

    return fullPath;
  }
}
