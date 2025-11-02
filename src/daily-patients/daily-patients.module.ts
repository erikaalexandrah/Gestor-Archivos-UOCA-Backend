import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyPatientsService } from './daily-patients.service';
import { DailyPatientsController } from './daily-patients.controller';
import { DailyPatient, DailyPatientSchema } from './schema/daily-patient.schema';
import { PatientsModule } from 'src/patients/patients.module';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { ItemsModule } from 'src/items/items.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyPatient.name, schema: DailyPatientSchema },
    ]),
    PatientsModule, 
    DoctorsModule,  
    ItemsModule,   
  ],
  controllers: [DailyPatientsController],
  providers: [DailyPatientsService],
  exports: [DailyPatientsService],
})
export class DailyPatientsModule {}
