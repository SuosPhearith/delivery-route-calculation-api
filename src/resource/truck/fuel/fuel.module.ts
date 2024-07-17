import { Module } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [FuelController],
  providers: [FuelService],
  imports: [AuthModule],
})
export class FuelModule {}
