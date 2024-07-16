import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService],
  imports: [AuthModule],
})
export class AssistantModule {}
