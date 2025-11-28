// src/reports/reports.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";

@Controller("reports")
export class ReportsController {
  private readonly basePaths: string[];
  private readonly doctorBasePath: string;

  constructor() {
    // ============================================================
    // BASE GENERAL (PDFs generados por el sistema)
    // ============================================================
    const raw = process.env.REPORTS_BASE_PATH || "";
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

    console.log("REPORTS_BASE_PATH =", this.basePaths);

    // ============================================================
    // BASE PARA CARPETAS DE DOCTORES
    // ============================================================
    this.doctorBasePath = process.env.DOCTORES_BASE_PATH
      ? path.normalize(process.env.DOCTORES_BASE_PATH)
      : "";

    console.log("DOCTORES_BASE_PATH =", this.doctorBasePath);
  }

  // ============================================================
  // 📂 LISTAR ARCHIVOS DE UNA CARPETA DE DOCTOR
  // GET /reports/doctor-files/:doctorFolder
  // ============================================================
  @Get("doctor-files/:doctorFolder")
  async listDoctorFiles(@Req() req: Request, @Res() res: Response) {
    if (!this.doctorBasePath) {
      throw new NotFoundException("DOCTORES_BASE_PATH no está configurado");
    }

    const folderRaw = req.params.doctorFolder;
    if (!folderRaw) throw new NotFoundException("Nombre de carpeta inválido");

    // Sanitizar nombre de carpeta
    const doctorFolder = folderRaw.replace(/\.\./g, "").trim();

    const folderPath = path.join(this.doctorBasePath, doctorFolder);

    // Verifica que exista y sea carpeta
    try {
      const stat = await fs.promises.stat(folderPath);
      if (!stat.isDirectory()) {
        throw new NotFoundException("La ruta no es una carpeta");
      }
    } catch {
      throw new NotFoundException(`Carpeta no encontrada: ${doctorFolder}`);
    }

    // Leer archivos (solo un nivel)
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
  // 📄 DESCARGAR PDF SEGÚN MODO:
  // - MODO B: /reports?doctorFolder=X&fileName=Y
  // - MODO A: PDFs globales (comportamiento original)
  // ============================================================
  @Get("*")
  async getReport(@Req() req: Request, @Res() res: Response) {
    const { doctorFolder, fileName } = req.query as {
      doctorFolder?: string;
      fileName?: string;
    };

    // ============================================================
    // 🔵 MODO B — BUSCAR EN CARPETAS DE DOCTOR
    // ============================================================
    if (doctorFolder && fileName) {
      if (!this.doctorBasePath) {
        throw new NotFoundException("DOCTORES_BASE_PATH no configurado");
      }

      console.log("📁 [Doctor Mode] doctorFolder =", doctorFolder);
      console.log("📄 [Doctor Mode] fileName =", fileName);

      // Sanitizar sin NORMALIZAR el filename
      const cleanedFolder = String(doctorFolder).replace(/\.\./g, "").trim();
      const cleanedFile = String(fileName).replace(/\.\./g, "").trim();

      const fullPath = path.join(
        this.doctorBasePath,
        cleanedFolder,
        cleanedFile
      );

      console.log("🔍 [Doctor Mode] Trying:", fullPath);

      try {
        await fs.promises.access(fullPath, fs.constants.F_OK);
      } catch {
        throw new NotFoundException("Archivo del doctor no encontrado");
      }

      return res.sendFile(fullPath);
    }

    // ============================================================
    // 🟢 MODO A — ORIGINAL (PDFs globales)
    // ============================================================
    if (this.basePaths.length === 0) {
      throw new NotFoundException("REPORTS_BASE_PATH no configurado");
    }

    const relPath = req.params[0];
    if (!relPath) throw new NotFoundException("Ruta no válida");

    const cleanedRel = relPath.replace(/\.\./g, "").replace(/^[\\/]+/, "");

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

      // Buscar por nombre en subcarpetas
      const found = await this.findInSubdirs(base, filename);
      if (found) {
        finalPath = found;
        break;
      }
    }

    if (!finalPath || !(await existsAsync(finalPath))) {
      throw new NotFoundException("Archivo no encontrado");
    }

    return res.sendFile(finalPath);
  }

  // ============================================================
  // 🔍 BUSCAR ARCHIVO POR NOMBRE EN SUBCARPETAS
  // ============================================================
  private async findInSubdirs(
    root: string,
    targetName: string,
    maxDepth = 8,
    maxDirs = 10000
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
}
