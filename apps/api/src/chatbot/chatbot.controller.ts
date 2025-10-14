import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatbotRequestDto, ChatbotResponseDto } from './dto/chatbot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get()
  @ApiOperation({ summary: 'Procesar pregunta del chatbot (público)' })
  @ApiQuery({ name: 'q', description: 'Pregunta del usuario', required: true })
  @ApiResponse({
    status: 200,
    description: 'Respuesta del chatbot',
    type: ChatbotResponseDto,
  })
  async getChatbotResponse(@Query('q') question: string): Promise<ChatbotResponseDto> {
    return await this.chatbotService.processQuestion(question);
  }

  @Get('auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Procesar pregunta del chatbot (autenticado)' })
  @ApiQuery({ name: 'q', description: 'Pregunta del usuario', required: true })
  @ApiResponse({
    status: 200,
    description: 'Respuesta del chatbot',
    type: ChatbotResponseDto,
  })
  async getChatbotResponseAuth(@Query('q') question: string): Promise<ChatbotResponseDto> {
    return await this.chatbotService.processQuestion(question);
  }
}
