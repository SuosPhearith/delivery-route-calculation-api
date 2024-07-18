import { Module } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [CaseController],
  providers: [CaseService],
  imports: [AuthModule],
})
export class CaseModule {}
