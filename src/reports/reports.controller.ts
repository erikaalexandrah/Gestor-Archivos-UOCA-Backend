// src/reports/reports.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schema/user.schema';

@Controller('reports')
export class ReportsController {
  private readonly basePaths: string[];
  private readonly doctorBasePath: string;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    // BASE GENERAL (PDFs generados por el sistema)
    const raw = process.env.REPORTS_BASE_PATH || '';
    this.basePaths = raw
      .split(/[;,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (
          (s.startsWith('"') && s.endsWith('"')) ||
          (s.startsWith("'") && s.endsWith("'"))
        ) {
          s = s.slice(1, -1);
        }
        return path.normalize(s);
      });

    console.log('REPORTS_BASE_PATH =', this.basePaths);

    // BASE PARA CARPETAS DE DOCTORES
    this.doctorBasePath = process.env.DOCTORES_BASE_PATH
      ? path.normalize(process.env.DOCTORES_BASE_PATH)
      : '';

    console.log('DOCTORES_BASE_PATH =', this.doctorBasePath);
  }

  // ============================================================
  // 📂 LISTAR ARCHIVOS DE UNA CARPETA DE DOCTOR
  // GET /reports/doctor-files/:doctorFolder
  // ============================================================
  @Get('doctor-files/:doctorFolder')
  async listDoctorFiles(@Req() req: Request, @Res() res: Response) {
    if (!this.doctorBasePath) {
      throw new NotFoundException('DOCTORES_BASE_PATH no está configurado');
    }

    const folderRaw = req.params.doctorFolder;
    if (!folderRaw) throw new NotFoundException('Nombre de carpeta inválido');

    const doctorFolder = folderRaw.replace(/\.\./g, '').trim();
    const folderPath = path.join(this.doctorBasePath, doctorFolder);

    try {
      const stat = await fs.promises.stat(folderPath);
      if (!stat.isDirectory()) {
        throw new NotFoundException('La ruta no es una carpeta');
      }
    } catch {
      throw new NotFoundException(`Carpeta no encontrada: ${doctorFolder}`);
    }

    const entries = await fs.promises.readdir(folderPath, {
      withFileTypes: true,
    });

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    return res.json({
      folder: doctorFolder,
      total: files.length,
      files,
    });
  }


  // ============================================================
  // 🔎 BUSCAR TODOS LOS PDF QUE CONTENGAN LA CÉDULA
  // GET /reports/by-fid/:fid
  // ============================================================
  @Get('by-fid/:fid')
  async findReportByFid(@Param('fid') fid: string, @Res() res: Response) {
    if (!fid || !fid.trim()) {
      throw new NotFoundException('FID inválido');
    }

    const cleanedFid = fid.trim();
    const regex = new RegExp(
      cleanedFid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );

    const doctorFiles: { doctorFolder: string; fileName: string }[] = [];
    const globalFiles: { relPath: string }[] = [];

    // 1) Buscar en usuarios con rol doctor para obtener sus carpetas
    const doctors = await this.userModel
      .find({ role: 'doctor', filePath: { $exists: true, $ne: '' } })
      .select('filePath')
      .lean()
      .exec();

    const doctorFolders = Array.from(
      new Set(
        doctors
          .map((d: any) => d.filePath)
          .filter((p: string) => typeof p === 'string' && p.trim()),
      ),
    );

    // 2) Buscar en DOCTORES_BASE_PATH y acumular TODOS
    if (this.doctorBasePath && doctorFolders.length) {
      for (const folder of doctorFolders) {
        const cleanedFolder = String(folder).replace(/\.\./g, '').trim();
        const baseDir = path.join(this.doctorBasePath, cleanedFolder);

        let stat: fs.Stats;
        try {
          stat = await fs.promises.stat(baseDir);
        } catch {
          continue;
        }
        if (!stat.isDirectory()) continue;

        const foundList = await this.findAllPdfsByRegexInDir(
          baseDir,
          regex,
          4,
        );

        for (const fullPath of foundList) {
          // ruta relativa completa desde DOCTORES_BASE_PATH,
          // para conservar subcarpetas si las hay
          const relFromRoot = path
            .relative(this.doctorBasePath, fullPath)
            .replace(/\\/g, '/'); // ej: "Dr. Salomón, Nayib/2025/archivo.pdf"

          doctorFiles.push({
            // carpeta relativa (todo menos el nombre de archivo)
            doctorFolder: path.dirname(relFromRoot).replace(/\\/g, '/'),
            fileName: path.basename(fullPath),
          });
        }
      }
    }

    // 3) Buscar también en REPORTS_BASE_PATH (modo global) y acumular TODOS
    if (this.basePaths.length) {
      for (const base of this.basePaths) {
        const foundList = await this.findAllPdfsByRegexInDir(
          base,
          regex,
          8,
        );
        for (const fullPath of foundList) {
          const relPath = path.relative(base, fullPath).replace(/\\/g, '/');
          globalFiles.push({ relPath });
        }
      }
    }

    if (!doctorFiles.length && !globalFiles.length) {
      throw new NotFoundException(
        `No se encontró ningún PDF que contenga la cédula ${cleanedFid}`,
      );
    }

    return res.json({
      ok: true,
      doctorFiles,
      globalFiles,
    });
  }

  // ============================================================
  // 📄 DESCARGAR PDF SEGÚN MODO:
  // - MODO B: /reports?doctorFolder=X&fileName=Y
  // - MODO A: /reports/rel/path (PDFs globales)
  // ============================================================

    @Get()
  async getReportRoot(@Req() req: Request, @Res() res: Response) {
    return this.getReport(req, res);
  }
  
  @Get('*')
  async getReport(@Req() req: Request, @Res() res: Response) {
    const { doctorFolder, fileName } = req.query as {
      doctorFolder?: string;
      fileName?: string;
    };

    console.log('🟣 getReport HIT =>', req.method, req.url);
    console.log('📁 doctorFolder =', doctorFolder);
    console.log('📄 fileName =', fileName);

  console.log('🟣 getReport HIT =>', req.method, req.url);
  console.log('📁 doctorFolder =', doctorFolder);
  console.log('📄 fileName =', fileName);

  if (doctorFolder && fileName) {
    const cleanedFolder = String(doctorFolder).replace(/\.\./g, '').trim();
    const cleanedFile = String(fileName).replace(/\.\./g, '').trim();

    const fullPath = path.join(
      this.doctorBasePath,
      cleanedFolder,
      cleanedFile,
    );

    console.log('🔍 [Doctor Mode] Trying:', fullPath);

    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch (e) {
      console.error('❌ access error:', e);
      throw new NotFoundException('Archivo del doctor no encontrado');
    }

    return res.sendFile(fullPath);
  }

    // 🟢 MODO A — ORIGINAL (PDFs globales)
    if (this.basePaths.length === 0) {
      throw new NotFoundException('REPORTS_BASE_PATH no configurado');
    }

    const relPath = req.params[0];
    if (!relPath) throw new NotFoundException('Ruta no válida');

    const cleanedRel = relPath.replace(/\.\./g, '').replace(/^[\\/]+/, '');
    const filename = path.basename(cleanedRel);

    const existsAsync = async (p: string) => {
      try {
        await fs.promises.access(p, fs.constants.F_OK);
        return true;
      } catch {
        return false;
      }
    };

    let finalPath: string | null = null;

    for (const base of this.basePaths) {
      const candidate = path.join(base, cleanedRel);

      if (await existsAsync(candidate)) {
        finalPath = candidate;
        break;
      }

      const found = await this.findInSubdirs(base, filename);
      if (found) {
        finalPath = found;
        break;
      }
    }

    if (!finalPath || !(await existsAsync(finalPath))) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.sendFile(finalPath);
  }

  // ============================================================
  // 🔍 BUSCAR ARCHIVO POR NOMBRE EXACTO EN SUBCARPETAS
  // ============================================================
  private async findInSubdirs(
    root: string,
    targetName: string,
    maxDepth = 8,
    maxDirs = 10000,
  ) {
    const queue = [{ dir: root, depth: 0 }];
    let visited = 0;

    while (queue.length) {
      const { dir, depth } = queue.shift()!;
      if (++visited > maxDirs) break;

      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isFile() && e.name === targetName) return full;
        if (e.isDirectory() && depth < maxDepth)
          queue.push({ dir: full, depth: depth + 1 });
      }
    }

    return null;
  }

  // ============================================================
  // 🔍 BUSCAR TODOS LOS PDF POR REGEX EN NOMBRE (SUBCARPETAS)
  // ============================================================
  private async findAllPdfsByRegexInDir(
    root: string,
    nameRegex: RegExp,
    maxDepth = 8,
    maxDirs = 10000,
  ): Promise<string[]> {
    const queue = [{ dir: root, depth: 0 }];
    let visited = 0;
    const results: string[] = [];

    while (queue.length) {
      const { dir, depth } = queue.shift()!;
      if (++visited > maxDirs) break;

      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (
          e.isFile() &&
          nameRegex.test(e.name) &&
          e.name.toLowerCase().endsWith('.pdf')
        ) {
          results.push(full);
        }
        if (e.isDirectory() && depth < maxDepth) {
          queue.push({ dir: full, depth: depth + 1 });
        }
      }
    }

    return results;
  }
}
