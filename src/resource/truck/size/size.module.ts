import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [SizeController],
  providers: [SizeService],
  imports: [AuthModule],
})
export class SizeModule {}
