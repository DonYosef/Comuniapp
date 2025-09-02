import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener información de la aplicación' })
  @ApiResponse({ status: 200, description: 'Información de la aplicación' })
  getHello(): string {
    return this.appService.getHello();
  }
}
