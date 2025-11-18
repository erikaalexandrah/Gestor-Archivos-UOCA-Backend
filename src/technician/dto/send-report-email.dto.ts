import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendReportEmailDto {
  @IsString()
  cedula: string;

  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsArray()
  @IsString({ each: true })
  servicios: string[];

  @IsString()
  asunto: string;

  @IsString()
  cuerpo: string;

  /**
   * IDs de las atenciones (appointments/daily-patients) a actualizar tras el envío del correo.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  attentionIds: string[];

  /**
   * Rutas lógicas/relativas de los informes a adjuntar.
   * Ej: "paciente123/informe-456.pdf"
   * Se resolverán con REPORTS_BASE_PATH en el servicio.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  reportPaths: string[];
}
