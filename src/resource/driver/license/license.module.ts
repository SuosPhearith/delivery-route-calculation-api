import { Module } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [LicenseController],
  providers: [LicenseService],
  imports: [AuthModule],
})
export class LicenseModule {}
