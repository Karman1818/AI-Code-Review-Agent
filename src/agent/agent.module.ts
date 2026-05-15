import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ToolExecutorService } from './tools/tool-executor.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, ToolExecutorService],
})
export class AgentModule {}
