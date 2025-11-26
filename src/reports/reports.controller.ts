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
  private readonly basePaths: string[];

  constructor() {
    const raw = process.env.REPORTS_BASE_PATH || '';
    // soporta separadores ; , |
    this.basePaths = raw
      .split(/[;,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // quitar comillas si las hubiera y normalizar
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          s = s.slice(1, -1);
        }
        return path.normalize(s);
      });
    console.log('REPORTS_BASE_PATHS=', this.basePaths);
    if (this.basePaths.length === 0) {
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
    if (this.basePaths.length === 0) {
      throw new NotFoundException('Ruta base no configurada');
    }

    const relPath = req.params[0];
    if (!relPath) {
      throw new NotFoundException('Ruta no válida');
    }

    const cleanedRel = relPath.replace(/\0/g, '').replace(/\.\./g, '').replace(/^[\\/]+/, '');

    const existsAsync = async (p: string) => {
      try {
        await fs.promises.access(p, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    };

    const findInSubdirs = async (root: string, targetName: string, maxDepth = 8, maxDirs = 10000) => {
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
    };

    const filename = path.basename(cleanedRel);
    let finalPath: string | null = null;

    // Probar en cada base
    for (const base of this.basePaths) {
      const baseResolved = base; // ya normalizado en constructor
      const candidate = path.join(baseResolved, cleanedRel);

      // 1) Intentar ruta exacta
      if (await existsAsync(candidate)) {
        // seguridad: comprobar que candidate está dentro de baseResolved
        const relative = path.relative(baseResolved, candidate);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          finalPath = candidate;
          break;
        }
      }

      // 2) Buscar por nombre en subcarpetas de esta base
      const found = await findInSubdirs(baseResolved, filename);
      if (found) {
        const relativeFound = path.relative(baseResolved, found);
        if (!relativeFound.startsWith('..') && !path.isAbsolute(relativeFound)) {
          finalPath = found;
          console.log('Archivo encontrado en base:', baseResolved, found);
          break;
        }
      }
    }

    if (!finalPath || !(await existsAsync(finalPath))) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.sendFile(finalPath);
  }
}
