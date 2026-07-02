import { Module } from '@nestjs/common';
import { VeterinariesController } from './veterinaries.controller';
import { VeterinariesService } from './veterinaries.service';

@Module({
  controllers: [VeterinariesController],
  providers: [VeterinariesService],
  exports: [VeterinariesService],
})
export class VeterinariesModule {}
