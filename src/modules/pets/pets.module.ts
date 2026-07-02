import { Module } from '@nestjs/common';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';

@Module({
  controllers: [PetsController, MedicalRecordsController],
  providers: [PetsService, MedicalRecordsService],
  exports: [PetsService],
})
export class PetsModule {}
