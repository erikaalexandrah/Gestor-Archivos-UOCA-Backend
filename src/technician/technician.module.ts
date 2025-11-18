// technician.module.ts
import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { DailyPatientsModule } from 'src/daily-patients/daily-patients.module';

@Module({
  imports: [
    DailyPatientsModule
  ],
  providers: [TechnicianService],
  controllers: [TechnicianController],
})
export class TechnicianModule {}
