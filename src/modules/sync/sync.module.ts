import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { VeterinariesModule } from '../veterinaries/veterinaries.module';
import { PetsModule } from '../pets/pets.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { SpecialistsModule } from '../specialists/specialists.module';

@Module({
  imports: [
    VeterinariesModule,
    PetsModule,
    ProductsModule,
    UsersModule,
    SpecialistsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
