import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar pregunta del chatbot (autenticado con contexto de usuario)' })
  @ApiQuery({ name: 'q', description: 'Pregunta del usuario', required: true })
  @ApiResponse({
    status: 200,
    description: 'Respuesta del chatbot personalizada según el rol del usuario',
    type: ChatbotResponseDto,
  })
  async getChatbotResponseAuth(
    @Query('q') question: string,
    @Request() req: any,
  ): Promise<ChatbotResponseDto> {
    return await this.chatbotService.processQuestionWithUserContext(question, req.user);
  }
}
