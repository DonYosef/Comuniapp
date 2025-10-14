import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotResponseDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processQuestion(question: string): Promise<ChatbotResponseDto> {
    const lowerQuestion = question.toLowerCase().trim();

    if (!question) {
      return { answer: 'Por favor ingresa una pregunta.' };
    }

    // --- 1) ESPACIOS COMUNES ---
    if (lowerQuestion.includes('espacios comunes')) {
      return await this.getCommonSpacesInfo();
    }

    // --- 2) AVISOS COMUNITARIOS ---
    if (lowerQuestion.includes('avisos')) {
      return await this.getCommunityAnnouncements();
    }

    // --- 3) CONSULTA AL MODELO DE HUGGING FACE ---
    return await this.queryHuggingFace(question);
  }

  private async getCommonSpacesInfo(): Promise<ChatbotResponseDto> {
    try {
      const spaces = await this.prisma.communityCommonSpace.findMany({
        where: { isActive: true },
        include: {
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (spaces.length === 0) {
        return { answer: 'No hay espacios comunes registrados actualmente.' };
      }

      let response = 'Estos son los espacios comunes con su disponibilidad y horarios:\n\n';

      for (const space of spaces) {
        const status = space.isActive ? 'Disponible ✅' : 'No disponible ❌';
        response += `🏢 ${space.name} - ${status}\n`;

        if (space.schedules.length > 0) {
          for (const schedule of space.schedules) {
            const dayName = this.getDayName(schedule.dayOfWeek);
            response += `   - ${dayName}: ${schedule.startTime} - ${schedule.endTime}\n`;
          }
        } else {
          response += '   * No hay horarios registrados.\n';
        }
        response += '\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting common spaces info:', error);
      return { answer: 'Ocurrió un error al obtener la información de espacios comunes.' };
    }
  }

  private async getCommunityAnnouncements(): Promise<ChatbotResponseDto> {
    try {
      const announcements = await this.prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      });

      if (announcements.length === 0) {
        return { answer: 'No hay avisos registrados actualmente.' };
      }

      let response = 'Estos son los últimos avisos de la comunidad:\n\n';

      for (const announcement of announcements) {
        const date = announcement.publishedAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        response += `📢 ${announcement.title} (${date}): ${announcement.content}\n\n`;
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting community announcements:', error);
      return { answer: 'Ocurrió un error al obtener los avisos de la comunidad.' };
    }
  }

  private async queryHuggingFace(question: string): Promise<ChatbotResponseDto> {
    try {
      const hfToken = this.configService.get<string>('HF_TOKEN');

      if (!hfToken) {
        this.logger.error('HF_TOKEN not configured');
        return { answer: 'El servicio de IA no está configurado correctamente.' };
      }

      const payload = {
        model: 'openai/gpt-oss-120b:cerebras',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente amable que saluda. 
            Si identificas una palabra que sea como un saludo o te pregunta como estas?, aunque esté mal escrita, tú saludas. 
            Tu función principal es responder preguntas relacionadas con la residencia. 
            Al momento de conversar con el usuario para brindar ayuda, sugiere al usuario solamente usar palabras clave como 'espacios comunes', 'avisos' o 'gastos comunes' esto debe ser breve y claro.
            luego dependiendo de la palabra que envie el usuario o una de estas que se encuentre en el texto que envie tu le explicas, ya que la conversación debe ser natural, 
            entonces le explicas para que sirve esa palabra clave, por ejemplo: es un modulo en el cual te puedes dirigir y gestionar tus gastos y obtener un reporte financiero,
            tiene que ser un texto breve y entendible, y así sucesivamente para las otras palabras clave.
            Si el usuario manda un mensaje de despedida aunque este mal escrito tu te despides y le mencionas que estas para ayudarlo`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      };

      const response = await fetch(this.HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

      return { answer };
    } catch (error) {
      this.logger.error('Error querying Hugging Face:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { answer: `Ocurrió un error al comunicarse con la IA: ${errorMessage}` };
    }
  }

  private getDayName(dayOfWeek: string): string {
    const dayNames: Record<string, string> = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo',
    };
    return dayNames[dayOfWeek] || dayOfWeek;
  }
}
