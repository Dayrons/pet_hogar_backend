import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { FileUploadModule } from './shared/services/file-upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VeterinariesModule } from './modules/veterinaries/veterinaries.module';
import { PetsModule } from './modules/pets/pets.module';
import { ProductsModule } from './modules/products/products.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AdoptionsModule } from './modules/adoptions/adoptions.module';
import { CartModule } from './modules/cart/cart.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { SalesModule } from './modules/sales/sales.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule,
    PrismaModule,
    FileUploadModule,
    AuthModule,
    UsersModule,
    VeterinariesModule,
    PetsModule,
    ProductsModule,
    AppointmentsModule,
    AdoptionsModule,
    CartModule,
    DashboardModule,
    SpecialistsModule,
    SalesModule,
    SyncModule,
  ],
})
export class AppModule {}
