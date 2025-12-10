import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { ItemsModule } from './items/items.module';
import { DailyPatientsModule } from './daily-patients/daily-patients.module';
import { AuthModule } from './auth/auth.module';
import { TechnicianModule } from './technician/technician.module';
import { ReportsModule } from './reports/reports.module';
import { HistoryAttentionsModule } from './history-attentions/history-attentions.module';

@Module({
  imports: [
    // cargar .env y ConfigService global
    ConfigModule.forRoot({ isGlobal: true }),

    // conectar a Mongo usando la variable de entorno MONGODB_URI
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/gestor_archivos_uoca',
        // Si necesitas opciones adicionales, añádelas aquí
        // e.g. serverSelectionTimeoutMS: 5000
      }),
      inject: [ConfigService],
    }),

    DoctorsModule,
    PatientsModule,
    ItemsModule,
    DailyPatientsModule,
    AuthModule,
    TechnicianModule,
    ReportsModule,
    HistoryAttentionsModule
  ],

})
export class AppModule {}
