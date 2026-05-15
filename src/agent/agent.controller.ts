import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { IsString } from 'class-validator';

export class AnalyzeDto {
  @IsString()
  code: string;
}

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // MISJA 1: Test połączenia z API
  @Get('ping')
  async ping() {
    return this.agentService.ping();
  }

  // MISJA 3: Główny endpoint — analiza kodu przez agenta
  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto) {
    return this.agentService.analyze(dto.code);
  }

  // MISJA 2: Test pojedynczego narzędzia
  @Post('tool/:name')
  async testTool(@Param('name') name: string, @Body() dto: AnalyzeDto) {
    return { result: this.agentService.testTool(name, dto.code) };
  }

  // BONUS: Historia analiz
  @Get('history')
  getHistory() {
    return this.agentService.getHistory();
  }
}
