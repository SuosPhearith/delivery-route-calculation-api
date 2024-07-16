import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [DriverController],
  providers: [DriverService],
  imports: [AuthModule],
})
export class DriverModule {}
