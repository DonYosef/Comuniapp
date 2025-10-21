import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotResponseDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

  // Cache para respuestas frecuentes y control de rate limiting
  private responseCache = new Map<string, { answer: string; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 10; // Límite conservador

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processQuestion(question: string): Promise<ChatbotResponseDto> {
    const lowerQuestion = question.toLowerCase().trim();

    if (!question) {
      return { answer: 'Por favor ingresa una pregunta.' };
    }

    // --- 0) RESPUESTAS RÁPIDAS (SALUDOS Y COMANDOS BÁSICOS) ---
    const quickResponse = this.getQuickResponse(lowerQuestion);
    if (quickResponse) {
      return { answer: quickResponse };
    }

    // --- 1) ESPACIOS COMUNES ---
    if (lowerQuestion.includes('espacios comunes') || lowerQuestion.includes('espacios')) {
      return await this.getCommonSpacesInfo();
    }

    // --- 2) AVISOS COMUNITARIOS ---
    if (lowerQuestion.includes('avisos') || lowerQuestion.includes('comunicados')) {
      return await this.getCommunityAnnouncements();
    }

    // --- 3) GASTOS COMUNES ---
    if (
      lowerQuestion.includes('gastos comunes') ||
      lowerQuestion.includes('gastos') ||
      lowerQuestion.includes('cuotas')
    ) {
      return await this.getCommonExpensesInfo();
    }

    // --- 4) VISITANTES ---
    if (lowerQuestion.includes('visitantes') || lowerQuestion.includes('visitas')) {
      return await this.getVisitorsInfo();
    }

    // --- 5) ENCOMIENDAS ---
    if (lowerQuestion.includes('encomiendas') || lowerQuestion.includes('paquetes')) {
      return await this.getParcelsInfo();
    }

    // --- 6) CONSULTA AL MODELO DE HUGGING FACE ---
    return await this.queryHuggingFace(question);
  }

  async processQuestionWithUserContext(question: string, user: any): Promise<ChatbotResponseDto> {
    const lowerQuestion = question.toLowerCase().trim();

    if (!question) {
      return { answer: 'Por favor ingresa una pregunta.' };
    }

    // --- 0) RESPUESTAS RÁPIDAS (SALUDOS Y COMANDOS BÁSICOS) ---
    const quickResponse = this.getQuickResponseWithUserContext(lowerQuestion, user);
    if (quickResponse) {
      return { answer: quickResponse };
    }

    // Obtener información del usuario y sus roles
    const userInfo = await this.getUserContextInfo(user);
    const userRoles = user.roles?.map((role: any) => role.name || role.role?.name) || [];

    // Determinar el tipo de usuario principal
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
    const isConcierge = userRoles.includes('CONCIERGE');
    const isResident = userRoles.includes('RESIDENT');

    // --- 1) ESPACIOS COMUNES ---
    if (lowerQuestion.includes('espacios comunes') || lowerQuestion.includes('espacios')) {
      return await this.getCommonSpacesInfoForUser(userInfo, userRoles);
    }

    // --- 2) AVISOS COMUNITARIOS ---
    if (lowerQuestion.includes('avisos') || lowerQuestion.includes('comunicados')) {
      return await this.getCommunityAnnouncementsForUser(userInfo, userRoles);
    }

    // --- 3) GASTOS COMUNES ---
    if (
      lowerQuestion.includes('gastos comunes') ||
      lowerQuestion.includes('gastos') ||
      lowerQuestion.includes('cuotas')
    ) {
      return await this.getCommonExpensesInfoForUser(userInfo, userRoles);
    }

    // --- 4) VISITANTES ---
    if (lowerQuestion.includes('visitantes') || lowerQuestion.includes('visitas')) {
      return await this.getVisitorsInfoForUser(userInfo, userRoles);
    }

    // --- 5) ENCOMIENDAS ---
    if (lowerQuestion.includes('encomiendas') || lowerQuestion.includes('paquetes')) {
      return await this.getParcelsInfoForUser(userInfo, userRoles);
    }

    // --- 6) CONSULTA AL MODELO DE HUGGING FACE CON CONTEXTO DE USUARIO ---
    return await this.queryHuggingFaceWithUserContext(question, userInfo, userRoles);
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
        return {
          answer:
            '📋 **Espacios Comunes**\n\n' +
            '❌ No hay espacios comunes registrados actualmente.\n\n' +
            '💡 *Contacta a la administración para más información.*',
        };
      }

      let response = '📋 **ESPACIOS COMUNES DISPONIBLES**\n';
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < spaces.length; i++) {
        const space = spaces[i];
        const status = space.isActive ? '✅ Disponible' : '❌ No disponible';

        response += `🏢 **${space.name}**\n`;
        response += `   📊 Estado: ${status}\n`;

        if (space.description) {
          response += `   📝 Descripción: ${space.description}\n`;
        }

        response += `   🔢 Cantidad: ${space.quantity}\n`;

        if (space.schedules.length > 0) {
          response += `   🕒 **Horarios de Atención:**\n`;

          // Agrupar horarios por día
          const scheduleGroups = this.groupSchedulesByTime(space.schedules);

          for (const [timeRange, days] of Object.entries(scheduleGroups)) {
            const dayList = days.map((day) => this.getDayName(day)).join(', ');
            response += `      • ${dayList}: ${timeRange}\n`;
          }
        } else {
          response += `   ⚠️  *No hay horarios registrados*\n`;
        }

        response += '\n';

        // Agregar separador entre espacios (excepto el último)
        if (i < spaces.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      response += '• Para reservar un espacio, contacta a la administración\n';
      response += '• Los horarios pueden variar en días festivos\n';
      response += '• Se requiere reserva previa para eventos especiales';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting common spaces info:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de espacios comunes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
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
        return {
          answer:
            '📢 **Avisos Comunitarios**\n\n' +
            '📭 No hay avisos registrados actualmente.\n\n' +
            '💡 *Mantente atento a futuras comunicaciones de la administración.*',
        };
      }

      let response = '📢 **ÚLTIMOS AVISOS COMUNITARIOS**\n';
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < announcements.length; i++) {
        const announcement = announcements[i];
        const date = announcement.publishedAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Determinar el emoji según el tipo de anuncio
        const typeEmoji = this.getAnnouncementTypeEmoji(announcement.type);

        response += `${typeEmoji} **${announcement.title}**\n`;
        response += `   📅 Fecha: ${date}\n`;
        response += `   🏷️  Tipo: ${this.getAnnouncementTypeName(announcement.type)}\n`;
        response += `   📄 Contenido: ${announcement.content}\n`;

        response += '\n';

        // Agregar separador entre anuncios (excepto el último)
        if (i < announcements.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      response += '• Los avisos se actualizan regularmente\n';
      response += '• Contacta a la administración para más detalles\n';
      response += '• Revisa periódicamente para estar informado';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting community announcements:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener los avisos de la comunidad.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async queryHuggingFace(question: string): Promise<ChatbotResponseDto> {
    try {
      // Verificar cache primero
      const cachedResponse = this.getCachedResponse(question);
      if (cachedResponse) {
        return { answer: cachedResponse };
      }

      // Verificar rate limiting
      if (this.isRateLimited()) {
        this.logger.warn('Rate limit exceeded, using fallback response');
        return { answer: this.getFallbackResponse(question) };
      }

      const hfToken = this.configService.get<string>('HF_TOKEN');

      if (!hfToken) {
        this.logger.error('HF_TOKEN not configured');
        return { answer: 'El servicio de IA no está configurado correctamente.' };
      }

      // Agregar timestamp de request
      this.addRequestTimestamp();

      // Obtener información contextual del sistema
      const contextInfo = await this.getSystemContext();

      const payload = {
        model: 'openai/gpt-oss-120b:cerebras',
        messages: [
          {
            role: 'system',
            content: `Eres ComunIAssistant, el asistente virtual inteligente de Comuniapp, un sistema de gestión comunitaria integral.

🎯 **TU IDENTIDAD:**
- Eres un asistente especializado en gestión de comunidades residenciales
- Tienes un tono profesional pero amigable y accesible
- Respondes siempre en español (español latinoamericano)
- Usas emojis moderadamente para hacer las respuestas más amigables

🏢 **CONTEXTO DEL SISTEMA:**
Comuniapp es una plataforma que gestiona:
• Espacios comunes (gimnasios, piscinas, salas de eventos, etc.)
• Gastos comunes y cuotas de mantenimiento
• Registro de visitantes y control de acceso
• Encomiendas y paquetes
• Avisos y comunicaciones comunitarias
• Reservas de espacios comunes
• Gestión de residentes y administración

💡 **FUNCIONALIDADES DISPONIBLES:**
El sistema puede consultar información específica usando estas palabras clave:
- "espacios comunes" → Información sobre áreas compartidas y sus horarios
- "avisos" → Últimos comunicados de la administración
- "gastos comunes" → Información sobre cuotas y gastos de mantenimiento
- "visitantes" → Registro de visitas y control de acceso
- "encomiendas" → Estado de paquetes y entregas

📊 **INFORMACIÓN CONTEXTUAL ACTUAL:**
${contextInfo}

📋 **INSTRUCCIONES DE RESPUESTA:**

1. **SALUDOS:** Si el usuario saluda (hola, buenos días, etc.), responde cordialmente y presenta brevemente tus capacidades.

2. **CONSULTAS ESPECÍFICAS:** Si menciona alguna palabra clave, explica qué información puede obtener y sugiere usar esa palabra clave para obtener datos actualizados.

3. **PREGUNTAS GENERALES:** Para preguntas sobre gestión comunitaria, proporciona respuestas útiles y prácticas basadas en tu conocimiento y la información contextual disponible.

4. **ORIENTACIÓN:** Siempre orienta al usuario sobre las funcionalidades disponibles del sistema.

5. **DESPEDIDAS:** Si el usuario se despide, responde cordialmente y recuérdale que estás disponible para ayudar.

🎨 **FORMATO DE RESPUESTAS:**
- Usa emojis relevantes para hacer las respuestas más visuales
- Estructura la información de manera clara y organizada
- Mantén las respuestas concisas pero informativas
- Incluye sugerencias prácticas cuando sea apropiado
- Usa la información contextual para dar respuestas más precisas

❌ **LIMITACIONES:**
- No puedes realizar transacciones o cambios en el sistema
- Para acciones específicas, siempre dirige al usuario a contactar la administración
- No proporcionas información personal de otros residentes
- Mantén la confidencialidad y privacidad

Recuerda: Tu objetivo es ser útil, informativo y facilitar la experiencia del usuario con el sistema de gestión comunitaria.`,
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
        if (response.status === 429) {
          this.logger.warn('Rate limit exceeded from Hugging Face API');
          return { answer: this.getFallbackResponse(question) };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

      // Guardar en cache
      this.setCachedResponse(question, answer);

      return { answer };
    } catch (error) {
      this.logger.error('Error querying Hugging Face:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Si es error de rate limiting, usar fallback
      if (errorMessage.includes('429')) {
        return { answer: this.getFallbackResponse(question) };
      }

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

  private groupSchedulesByTime(schedules: any[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const schedule of schedules) {
      const timeRange = `${schedule.startTime} - ${schedule.endTime}`;
      if (!groups[timeRange]) {
        groups[timeRange] = [];
      }
      groups[timeRange].push(schedule.dayOfWeek);
    }

    return groups;
  }

  private getAnnouncementTypeEmoji(type: string): string {
    const typeEmojis: Record<string, string> = {
      GENERAL: '📢',
      URGENT: '🚨',
      MAINTENANCE: '🔧',
      SECURITY: '🛡️',
      SOCIAL: '🎉',
    };
    return typeEmojis[type] || '📢';
  }

  private getAnnouncementTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      GENERAL: 'General',
      URGENT: 'Urgente',
      MAINTENANCE: 'Mantenimiento',
      SECURITY: 'Seguridad',
      SOCIAL: 'Social',
    };
    return typeNames[type] || 'General';
  }

  private async getCommonExpensesInfo(): Promise<ChatbotResponseDto> {
    try {
      const expenses = await this.prisma.communityExpense.findMany({
        where: {
          community: { isActive: true },
        },
        include: {
          community: true,
          items: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { dueDate: 'desc' },
        take: 3,
      });

      if (expenses.length === 0) {
        return {
          answer:
            '💰 **Gastos Comunes**\n\n' +
            '📭 No hay gastos comunes registrados actualmente.\n\n' +
            '💡 *Contacta a la administración para más información sobre las cuotas.*',
        };
      }

      let response = '💰 **ÚLTIMOS GASTOS COMUNES**\n';
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        const dueDate = expense.dueDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        response += `🏢 **${expense.community.name}**\n`;
        response += `   📅 Período: ${expense.period}\n`;
        response += `   💵 Total: $${expense.totalAmount.toFixed(2)}\n`;
        response += `   📆 Vencimiento: ${dueDate}\n`;
        response += `   📊 Método: ${this.getProrrateMethodName(expense.prorrateMethod)}\n`;

        if (expense.items.length > 0) {
          response += `   📋 **Detalle de Gastos:**\n`;
          for (const item of expense.items.slice(0, 3)) {
            response += `      • ${item.name}: $${item.amount.toFixed(2)}\n`;
          }
          if (expense.items.length > 3) {
            response += `      • ... y ${expense.items.length - 3} más\n`;
          }
        }

        response += '\n';

        if (i < expenses.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      response += '• Los gastos se prorratean según el coeficiente de cada unidad\n';
      response += '• Contacta a la administración para consultas específicas\n';
      response += '• Los pagos pueden realizarse por transferencia bancaria';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting common expenses info:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de gastos comunes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getVisitorsInfo(): Promise<ChatbotResponseDto> {
    try {
      const visitors = await this.prisma.visitor.findMany({
        where: {
          unit: {
            community: { isActive: true },
          },
        },
        include: {
          unit: {
            include: {
              community: true,
            },
          },
          host: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (visitors.length === 0) {
        return {
          answer:
            '👥 **Registro de Visitantes**\n\n' +
            '📭 No hay visitantes registrados actualmente.\n\n' +
            '💡 *Los residentes pueden registrar visitas a través del sistema.*',
        };
      }

      let response = '👥 **ÚLTIMOS VISITANTES REGISTRADOS**\n';
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < visitors.length; i++) {
        const visitor = visitors[i];
        const arrivalDate = visitor.expectedArrival.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusEmoji = this.getVisitorStatusEmoji(visitor.status);

        response += `${statusEmoji} **${visitor.visitorName}**\n`;
        response += `   🏠 Unidad: ${visitor.unit.number} - ${visitor.unit.community.name}\n`;
        response += `   👤 Anfitrión: ${visitor.host.name}\n`;
        response += `   📅 Llegada: ${arrivalDate}\n`;
        response += `   📋 Propósito: ${this.getVisitPurposeName(visitor.visitPurpose)}\n`;
        response += `   📊 Estado: ${this.getVisitorStatusName(visitor.status)}\n`;

        if (visitor.visitorPhone) {
          response += `   📞 Teléfono: ${visitor.visitorPhone}\n`;
        }

        response += '\n';

        if (i < visitors.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      response += '• Los visitantes deben registrarse antes de la visita\n';
      response += '• Se requiere identificación al ingresar\n';
      response += '• Contacta a la administración para más detalles';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting visitors info:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de visitantes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getParcelsInfo(): Promise<ChatbotResponseDto> {
    try {
      const parcels = await this.prisma.parcel.findMany({
        where: {
          unit: {
            community: { isActive: true },
          },
        },
        include: {
          unit: {
            include: {
              community: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
        take: 5,
      });

      if (parcels.length === 0) {
        return {
          answer:
            '📦 **Encomiendas**\n\n' +
            '📭 No hay encomiendas registradas actualmente.\n\n' +
            '💡 *Las encomiendas se registran automáticamente al llegar.*',
        };
      }

      let response = '📦 **ÚLTIMAS ENCOMIENDAS RECIBIDAS**\n';
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < parcels.length; i++) {
        const parcel = parcels[i];
        const receivedDate = parcel.receivedAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusEmoji = this.getParcelStatusEmoji(parcel.status);

        response += `${statusEmoji} **${parcel.description}**\n`;
        response += `   🏠 Unidad: ${parcel.unit.number} - ${parcel.unit.community.name}\n`;
        response += `   📅 Recibido: ${receivedDate}\n`;
        response += `   📊 Estado: ${this.getParcelStatusName(parcel.status)}\n`;

        if (parcel.sender) {
          response += `   👤 Remitente: ${parcel.sender}\n`;
        }

        if (parcel.retrievedAt) {
          const retrievedDate = parcel.retrievedAt.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          response += `   ✅ Retirado: ${retrievedDate}\n`;
        }

        response += '\n';

        if (i < parcels.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      response += '• Las encomiendas se mantienen por 7 días\n';
      response += '• Contacta a la administración para retirar\n';
      response += '• Se requiere identificación para retirar';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting parcels info:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de encomiendas.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  // Funciones auxiliares adicionales
  private getProrrateMethodName(method: string): string {
    const methodNames: Record<string, string> = {
      EQUAL: 'Igualitario',
      COEFFICIENT: 'Por Coeficiente',
    };
    return methodNames[method] || 'Igualitario';
  }

  private getVisitorStatusEmoji(status: string): string {
    const statusEmojis: Record<string, string> = {
      REGISTERED: '📝',
      ENTERED: '✅',
      EXITED: '🚪',
      EXPIRED: '⏰',
    };
    return statusEmojis[status] || '📝';
  }

  private getVisitorStatusName(status: string): string {
    const statusNames: Record<string, string> = {
      REGISTERED: 'Registrado',
      ENTERED: 'Ingresó',
      EXITED: 'Salió',
      EXPIRED: 'Expirado',
    };
    return statusNames[status] || 'Registrado';
  }

  private getVisitPurposeName(purpose: string): string {
    const purposeNames: Record<string, string> = {
      personal: 'Personal',
      business: 'Negocios',
      maintenance: 'Mantenimiento',
      delivery: 'Entrega',
      other: 'Otro',
    };
    return purposeNames[purpose] || purpose;
  }

  private getParcelStatusEmoji(status: string): string {
    const statusEmojis: Record<string, string> = {
      RECEIVED: '📦',
      RETRIEVED: '✅',
      EXPIRED: '⏰',
    };
    return statusEmojis[status] || '📦';
  }

  private getParcelStatusName(status: string): string {
    const statusNames: Record<string, string> = {
      RECEIVED: 'Recibido',
      RETRIEVED: 'Retirado',
      EXPIRED: 'Expirado',
    };
    return statusNames[status] || 'Recibido';
  }

  private async getSystemContext(): Promise<string> {
    try {
      // Obtener estadísticas básicas del sistema
      const [totalCommunities, totalSpaces, recentAnnouncements, pendingVisitors, pendingParcels] =
        await Promise.all([
          this.prisma.community.count({ where: { isActive: true } }),
          this.prisma.communityCommonSpace.count({ where: { isActive: true } }),
          this.prisma.announcement.count({
            where: {
              isActive: true,
              publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Últimos 7 días
            },
          }),
          this.prisma.visitor.count({
            where: {
              status: 'REGISTERED' as any,
              expectedArrival: { gte: new Date() },
            },
          }),
          this.prisma.parcel.count({
            where: {
              status: 'RECEIVED',
              receivedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Últimos 7 días
            },
          }),
        ]);

      return `
📈 **ESTADÍSTICAS DEL SISTEMA:**
• Comunidades activas: ${totalCommunities}
• Espacios comunes disponibles: ${totalSpaces}
• Avisos recientes (últimos 7 días): ${recentAnnouncements}
• Visitantes pendientes: ${pendingVisitors}
• Encomiendas recientes: ${pendingParcels}

🕒 **INFORMACIÓN TEMPORAL:**
• Fecha actual: ${new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
• Hora actual: ${new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })}

💡 **SUGERENCIAS CONTEXTUALES:**
${this.getContextualSuggestions(totalCommunities, totalSpaces, recentAnnouncements, pendingVisitors, pendingParcels)}
      `.trim();
    } catch (error) {
      this.logger.error('Error getting system context:', error);
      return '📊 Información del sistema temporalmente no disponible.';
    }
  }

  private getContextualSuggestions(
    communities: number,
    spaces: number,
    announcements: number,
    visitors: number,
    parcels: number,
  ): string {
    const suggestions = [];

    if (announcements > 0) {
      suggestions.push('• Hay avisos recientes disponibles - consulta "avisos" para verlos');
    }

    if (visitors > 0) {
      suggestions.push('• Hay visitantes registrados - consulta "visitantes" para ver el estado');
    }

    if (parcels > 0) {
      suggestions.push('• Hay encomiendas recientes - consulta "encomiendas" para ver detalles');
    }

    if (spaces > 0) {
      suggestions.push(
        '• Espacios comunes disponibles - consulta "espacios comunes" para horarios',
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        '• Usa palabras clave como "espacios comunes", "avisos", "gastos comunes" para obtener información específica',
      );
    }

    return suggestions.join('\n');
  }

  // === MÉTODOS ESPECÍFICOS PARA USUARIOS AUTENTICADOS ===

  private async getUserContextInfo(user: any): Promise<any> {
    try {
      const userWithDetails = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: { include: { role: true } },
          userUnits: {
            where: { status: 'CONFIRMED' },
            include: {
              unit: {
                include: {
                  community: {
                    include: {
                      organization: true,
                      commonSpaces: { where: { isActive: true } },
                      _count: { select: { units: true, announcements: true } },
                    },
                  },
                },
              },
            },
          },
          communityAdmins: {
            include: {
              community: {
                include: {
                  organization: true,
                  commonSpaces: { where: { isActive: true } },
                  _count: { select: { units: true, announcements: true } },
                },
              },
            },
          },
        },
      });

      return userWithDetails;
    } catch (error) {
      this.logger.error('Error getting user context info:', error);
      return null;
    }
  }

  private async getCommonSpacesInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      let whereClause: any = { isActive: true };
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todos los espacios
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve espacios de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        // Concierge y Resident ven espacios de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const spaces = await this.prisma.communityCommonSpace.findMany({
        where: whereClause,
        include: {
          community: { select: { name: true } },
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (spaces.length === 0) {
        return {
          answer:
            `📋 **Espacios Comunes - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `❌ No hay espacios comunes disponibles en ${communityContext}.\n\n` +
            `💡 *Contacta a la administración para más información.*`,
        };
      }

      let response = `📋 **ESPACIOS COMUNES DISPONIBLES**\n`;
      response += `👤 **Vista de:** ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 **Contexto:** ${communityContext}\n`;
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < spaces.length; i++) {
        const space = spaces[i];
        const status = space.isActive ? '✅ Disponible' : '❌ No disponible';

        response += `🏢 **${space.name}**\n`;
        if (isSuperAdmin || isCommunityAdmin) {
          response += `   🏘️  Comunidad: ${space.community.name}\n`;
        }
        response += `   📊 Estado: ${status}\n`;

        if (space.description) {
          response += `   📝 Descripción: ${space.description}\n`;
        }

        response += `   🔢 Cantidad: ${space.quantity}\n`;

        if (space.schedules.length > 0) {
          response += `   🕒 **Horarios de Atención:**\n`;

          const scheduleGroups = this.groupSchedulesByTime(space.schedules);

          for (const [timeRange, days] of Object.entries(scheduleGroups)) {
            const dayList = days.map((day) => this.getDayName(day)).join(', ');
            response += `      • ${dayList}: ${timeRange}\n`;
          }
        } else {
          response += `   ⚠️  *No hay horarios registrados*\n`;
        }

        response += '\n';

        if (i < spaces.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      if (isConcierge) {
        response += '• Como conserje, puedes gestionar las reservas de espacios\n';
        response += '• Contacta a los residentes para confirmar disponibilidad\n';
      } else if (isResident) {
        response += '• Para reservar un espacio, contacta al conserje o administración\n';
        response += '• Los horarios pueden variar en días festivos\n';
      } else if (isCommunityAdmin) {
        response += '• Puedes gestionar espacios comunes desde el panel de administración\n';
        response += '• Configura horarios y disponibilidad según necesidades\n';
      } else {
        response += '• Para reservar un espacio, contacta a la administración\n';
        response += '• Los horarios pueden variar en días festivos\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting common spaces info for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de espacios comunes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getCommunityAnnouncementsForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      let whereClause: any = { isActive: true };
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todos los avisos
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve avisos de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        // Concierge y Resident ven avisos de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const announcements = await this.prisma.announcement.findMany({
        where: whereClause,
        include: {
          community: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      });

      if (announcements.length === 0) {
        return {
          answer:
            `📢 **Avisos Comunitarios - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `📭 No hay avisos registrados en ${communityContext}.\n\n` +
            `💡 *Mantente atento a futuras comunicaciones de la administración.*`,
        };
      }

      let response = `📢 **ÚLTIMOS AVISOS COMUNITARIOS**\n`;
      response += `👤 **Vista de:** ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 **Contexto:** ${communityContext}\n`;
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < announcements.length; i++) {
        const announcement = announcements[i];
        const date = announcement.publishedAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const typeEmoji = this.getAnnouncementTypeEmoji(announcement.type);

        response += `${typeEmoji} **${announcement.title}**\n`;
        if (isSuperAdmin || isCommunityAdmin) {
          response += `   🏘️  Comunidad: ${announcement.community.name}\n`;
        }
        response += `   📅 Fecha: ${date}\n`;
        response += `   🏷️  Tipo: ${this.getAnnouncementTypeName(announcement.type)}\n`;
        response += `   📄 Contenido: ${announcement.content}\n`;

        response += '\n';

        if (i < announcements.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      if (isCommunityAdmin) {
        response += '• Puedes crear y gestionar avisos desde el panel de administración\n';
        response += '• Los avisos se envían automáticamente a todos los residentes\n';
      } else if (isConcierge) {
        response += '• Como conserje, mantente informado de todos los avisos\n';
        response += '• Puedes ayudar a los residentes con información adicional\n';
      } else {
        response += '• Los avisos se actualizan regularmente\n';
        response += '• Contacta a la administración para más detalles\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting community announcements for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener los avisos de la comunidad.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getCommonExpensesInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      let whereClause: any = {
        community: { isActive: true },
      };
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todos los gastos
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve gastos de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        // Concierge y Resident ven gastos de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const expenses = await this.prisma.communityExpense.findMany({
        where: whereClause,
        include: {
          community: true,
          items: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { dueDate: 'desc' },
        take: 3,
      });

      if (expenses.length === 0) {
        return {
          answer:
            `💰 **Gastos Comunes - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `📭 No hay gastos comunes registrados en ${communityContext}.\n\n` +
            `💡 *Contacta a la administración para más información sobre las cuotas.*`,
        };
      }

      let response = `💰 **ÚLTIMOS GASTOS COMUNES**\n`;
      response += `👤 **Vista de:** ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 **Contexto:** ${communityContext}\n`;
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        const dueDate = expense.dueDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        response += `🏢 **${expense.community.name}**\n`;
        response += `   📅 Período: ${expense.period}\n`;
        response += `   💵 Total: $${expense.totalAmount.toFixed(2)}\n`;
        response += `   📆 Vencimiento: ${dueDate}\n`;
        response += `   📊 Método: ${this.getProrrateMethodName(expense.prorrateMethod)}\n`;

        if (expense.items.length > 0) {
          response += `   📋 **Detalle de Gastos:**\n`;
          for (const item of expense.items.slice(0, 3)) {
            response += `      • ${item.name}: $${item.amount.toFixed(2)}\n`;
          }
          if (expense.items.length > 3) {
            response += `      • ... y ${expense.items.length - 3} más\n`;
          }
        }

        response += '\n';

        if (i < expenses.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      if (isCommunityAdmin) {
        response += '• Puedes gestionar gastos comunes desde el panel de administración\n';
        response += '• Los gastos se prorratean según el coeficiente de cada unidad\n';
      } else if (isResident) {
        response += '• Los gastos se prorratean según el coeficiente de tu unidad\n';
        response += '• Puedes consultar el detalle de tu cuota específica\n';
      } else {
        response += '• Los gastos se prorratean según el coeficiente de cada unidad\n';
        response += '• Contacta a la administración para consultas específicas\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting common expenses info for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de gastos comunes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getVisitorsInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      let whereClause: any = {};
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todos los visitantes
        whereClause.unit = { community: { isActive: true } };
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve visitantes de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.unit = {
            community: {
              isActive: true,
              id: { in: communityIds },
            },
          };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge) {
        // Concierge ve visitantes de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.unit = {
            community: {
              isActive: true,
              id: communityId,
            },
          };
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      } else if (isResident) {
        // Resident ve solo visitantes de sus unidades
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length > 0) {
          whereClause.unitId = { in: unitIds };
          communityContext = `sus unidades`;
        }
      }

      const visitors = await this.prisma.visitor.findMany({
        where: whereClause,
        include: {
          unit: {
            include: {
              community: true,
            },
          },
          host: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (visitors.length === 0) {
        return {
          answer:
            `👥 **Registro de Visitantes - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `📭 No hay visitantes registrados en ${communityContext}.\n\n` +
            `💡 *Los residentes pueden registrar visitas a través del sistema.*`,
        };
      }

      let response = `👥 **ÚLTIMOS VISITANTES REGISTRADOS**\n`;
      response += `👤 **Vista de:** ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 **Contexto:** ${communityContext}\n`;
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < visitors.length; i++) {
        const visitor = visitors[i];
        const arrivalDate = visitor.expectedArrival.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusEmoji = this.getVisitorStatusEmoji(visitor.status);

        response += `${statusEmoji} **${visitor.visitorName}**\n`;
        response += `   🏠 Unidad: ${visitor.unit.number} - ${visitor.unit.community.name}\n`;
        response += `   👤 Anfitrión: ${visitor.host.name}\n`;
        response += `   📅 Llegada: ${arrivalDate}\n`;
        response += `   📋 Propósito: ${this.getVisitPurposeName(visitor.visitPurpose)}\n`;
        response += `   📊 Estado: ${this.getVisitorStatusName(visitor.status)}\n`;

        if (visitor.visitorPhone) {
          response += `   📞 Teléfono: ${visitor.visitorPhone}\n`;
        }

        response += '\n';

        if (i < visitors.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      if (isConcierge) {
        response += '• Como conserje, puedes gestionar el registro de visitantes\n';
        response += '• Verifica la identificación de los visitantes al ingresar\n';
        response += '• Mantén actualizado el estado de las visitas\n';
      } else if (isResident) {
        response += '• Puedes registrar visitantes para tus unidades\n';
        response += '• Los visitantes deben registrarse antes de la visita\n';
      } else if (isCommunityAdmin) {
        response += '• Puedes gestionar el sistema de visitantes desde el panel\n';
        response += '• Configura políticas de acceso para tu comunidad\n';
      } else {
        response += '• Los visitantes deben registrarse antes de la visita\n';
        response += '• Se requiere identificación al ingresar\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting visitors info for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de visitantes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async getParcelsInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      let whereClause: any = {};
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todas las encomiendas
        whereClause.unit = { community: { isActive: true } };
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve encomiendas de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.unit = {
            community: {
              isActive: true,
              id: { in: communityIds },
            },
          };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge) {
        // Concierge ve encomiendas de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.unit = {
            community: {
              isActive: true,
              id: communityId,
            },
          };
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      } else if (isResident) {
        // Resident ve solo encomiendas de sus unidades
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length > 0) {
          whereClause.unitId = { in: unitIds };
          communityContext = `sus unidades`;
        }
      }

      const parcels = await this.prisma.parcel.findMany({
        where: whereClause,
        include: {
          unit: {
            include: {
              community: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
        take: 5,
      });

      if (parcels.length === 0) {
        return {
          answer:
            `📦 **Encomiendas - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `📭 No hay encomiendas registradas en ${communityContext}.\n\n` +
            `💡 *Las encomiendas se registran automáticamente al llegar.*`,
        };
      }

      let response = `📦 **ÚLTIMAS ENCOMIENDAS RECIBIDAS**\n`;
      response += `👤 **Vista de:** ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 **Contexto:** ${communityContext}\n`;
      response += '═'.repeat(50) + '\n\n';

      for (let i = 0; i < parcels.length; i++) {
        const parcel = parcels[i];
        const receivedDate = parcel.receivedAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusEmoji = this.getParcelStatusEmoji(parcel.status);

        response += `${statusEmoji} **${parcel.description}**\n`;
        response += `   🏠 Unidad: ${parcel.unit.number} - ${parcel.unit.community.name}\n`;
        response += `   📅 Recibido: ${receivedDate}\n`;
        response += `   📊 Estado: ${this.getParcelStatusName(parcel.status)}\n`;

        if (parcel.sender) {
          response += `   👤 Remitente: ${parcel.sender}\n`;
        }

        if (parcel.retrievedAt) {
          const retrievedDate = parcel.retrievedAt.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          response += `   ✅ Retirado: ${retrievedDate}\n`;
        }

        response += '\n';

        if (i < parcels.length - 1) {
          response += '─'.repeat(30) + '\n\n';
        }
      }

      response += '\n💡 **Información adicional:**\n';
      if (isConcierge) {
        response += '• Como conserje, puedes gestionar las encomiendas recibidas\n';
        response += '• Notifica a los residentes cuando lleguen sus paquetes\n';
        response += '• Mantén un registro actualizado del estado de entrega\n';
      } else if (isResident) {
        response += '• Las encomiendas se mantienen por 7 días\n';
        response += '• Contacta al conserje para retirar tus paquetes\n';
      } else if (isCommunityAdmin) {
        response += '• Puedes gestionar el sistema de encomiendas desde el panel\n';
        response += '• Configura políticas de retención para tu comunidad\n';
      } else {
        response += '• Las encomiendas se mantienen por 7 días\n';
        response += '• Contacta a la administración para retirar\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting parcels info for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de encomiendas.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async queryHuggingFaceWithUserContext(
    question: string,
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      // Crear clave de cache única para usuario autenticado
      const cacheKey = `${question.toLowerCase().trim()}_${userInfo?.id || 'anonymous'}`;
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return { answer: cachedResponse };
      }

      // Verificar rate limiting
      if (this.isRateLimited()) {
        this.logger.warn('Rate limit exceeded, using fallback response for authenticated user');
        return { answer: this.getFallbackResponse(question) };
      }

      const hfToken = this.configService.get<string>('HF_TOKEN');

      if (!hfToken) {
        this.logger.error('HF_TOKEN not configured');
        return { answer: 'El servicio de IA no está configurado correctamente.' };
      }

      // Agregar timestamp de request
      this.addRequestTimestamp();

      // Obtener información contextual del sistema y usuario
      const systemContext = await this.getSystemContext();
      const userContext = this.getUserContextForAI(userInfo, userRoles);

      const payload = {
        model: 'openai/gpt-oss-120b:cerebras',
        messages: [
          {
            role: 'system',
            content: `Eres ComunIAssistant, el asistente virtual inteligente de Comuniapp, un sistema de gestión comunitaria integral.

🎯 **TU IDENTIDAD:**
- Eres un asistente especializado en gestión de comunidades residenciales
- Tienes un tono profesional pero amigable y accesible
- Respondes siempre en español (español latinoamericano)
- Usas emojis moderadamente para hacer las respuestas más amigables

🏢 **CONTEXTO DEL SISTEMA:**
Comuniapp es una plataforma que gestiona:
• Espacios comunes (gimnasios, piscinas, salas de eventos, etc.)
• Gastos comunes y cuotas de mantenimiento
• Registro de visitantes y control de acceso
• Encomiendas y paquetes
• Avisos y comunicaciones comunitarias
• Reservas de espacios comunes
• Gestión de residentes y administración

💡 **FUNCIONALIDADES DISPONIBLES:**
El sistema puede consultar información específica usando estas palabras clave:
- "espacios comunes" → Información sobre áreas compartidas y sus horarios
- "avisos" → Últimos comunicados de la administración
- "gastos comunes" → Información sobre cuotas y gastos de mantenimiento
- "visitantes" → Registro de visitas y control de acceso
- "encomiendas" → Estado de paquetes y entregas

📊 **INFORMACIÓN CONTEXTUAL ACTUAL:**
${systemContext}

👤 **INFORMACIÓN DEL USUARIO ACTUAL:**
${userContext}

📋 **INSTRUCCIONES DE RESPUESTA:**

1. **SALUDOS:** Si el usuario saluda (hola, buenos días, etc.), responde cordialmente y presenta brevemente tus capacidades según su rol.

2. **CONSULTAS ESPECÍFICAS:** Si menciona alguna palabra clave, explica qué información puede obtener según su rol y sugiere usar esa palabra clave para obtener datos actualizados.

3. **PREGUNTAS GENERALES:** Para preguntas sobre gestión comunitaria, proporciona respuestas útiles y prácticas basadas en tu conocimiento, la información contextual disponible y los permisos del usuario.

4. **ORIENTACIÓN:** Siempre orienta al usuario sobre las funcionalidades disponibles del sistema según su rol específico.

5. **DESPEDIDAS:** Si el usuario se despide, responde cordialmente y recuérdale que estás disponible para ayudar.

🎨 **FORMATO DE RESPUESTAS:**
- Usa emojis relevantes para hacer las respuestas más visuales
- Estructura la información de manera clara y organizada
- Mantén las respuestas concisas pero informativas
- Incluye sugerencias prácticas cuando sea apropiado
- Usa la información contextual para dar respuestas más precisas
- Personaliza las respuestas según el rol del usuario

❌ **LIMITACIONES:**
- No puedes realizar transacciones o cambios en el sistema
- Para acciones específicas, siempre dirige al usuario a contactar la administración
- No proporcionas información personal de otros residentes
- Mantén la confidencialidad y privacidad
- Respeta los permisos y accesos del usuario según su rol

Recuerda: Tu objetivo es ser útil, informativo y facilitar la experiencia del usuario con el sistema de gestión comunitaria, adaptándote a su rol específico.`,
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
        if (response.status === 429) {
          this.logger.warn('Rate limit exceeded from Hugging Face API for authenticated user');
          return { answer: this.getFallbackResponse(question) };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

      // Guardar en cache con clave única
      this.setCachedResponse(cacheKey, answer);

      return { answer };
    } catch (error) {
      this.logger.error('Error querying Hugging Face with user context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Si es error de rate limiting, usar fallback
      if (errorMessage.includes('429')) {
        return { answer: this.getFallbackResponse(question) };
      }

      return { answer: `Ocurrió un error al comunicarse con la IA: ${errorMessage}` };
    }
  }

  private getUserRoleDisplayName(userRoles: string[]): string {
    if (userRoles.includes('SUPER_ADMIN')) return 'Super Administrador';
    if (userRoles.includes('COMMUNITY_ADMIN')) return 'Administrador de Comunidad';
    if (userRoles.includes('CONCIERGE')) return 'Conserje';
    if (userRoles.includes('RESIDENT')) return 'Residente';
    if (userRoles.includes('OWNER')) return 'Propietario';
    if (userRoles.includes('TENANT')) return 'Inquilino';
    return 'Usuario';
  }

  private getUserContextForAI(userInfo: any, userRoles: string[]): string {
    if (!userInfo) {
      return 'Usuario no autenticado - acceso limitado a información general';
    }

    const roleDisplayName = this.getUserRoleDisplayName(userRoles);
    const communities = userInfo.communityAdmins?.map((ca: any) => ca.community.name) || [];
    const userUnits =
      userInfo.userUnits?.map((uu: any) => `${uu.unit.number} (${uu.unit.community.name})`) || [];

    let context = `👤 **ROL:** ${roleDisplayName}\n`;
    context += `📧 **Email:** ${userInfo.email}\n`;
    context += `👤 **Nombre:** ${userInfo.name}\n`;

    if (communities.length > 0) {
      context += `🏢 **Comunidades administradas:** ${communities.join(', ')}\n`;
    }

    if (userUnits.length > 0) {
      context += `🏠 **Unidades asignadas:** ${userUnits.join(', ')}\n`;
    }

    // Agregar permisos específicos según el rol
    if (userRoles.includes('SUPER_ADMIN')) {
      context += `🔑 **Permisos:** Acceso total al sistema, gestión de organizaciones y usuarios\n`;
    } else if (userRoles.includes('COMMUNITY_ADMIN')) {
      context += `🔑 **Permisos:** Gestión completa de comunidades asignadas, usuarios, gastos y reportes\n`;
    } else if (userRoles.includes('CONCIERGE')) {
      context += `🔑 **Permisos:** Gestión de visitantes, encomiendas, reservas y avisos comunitarios\n`;
    } else if (userRoles.includes('RESIDENT')) {
      context += `🔑 **Permisos:** Vista de su unidad, gastos propios, gestión de visitantes propios y avisos\n`;
    }

    return context;
  }

  // === MÉTODOS PARA RESPUESTAS RÁPIDAS ===

  private getQuickResponse(lowerQuestion: string): string | null {
    // Saludos - Respuestas instantáneas
    if (
      lowerQuestion.includes('hola') ||
      lowerQuestion.includes('hi') ||
      lowerQuestion.includes('hey')
    ) {
      return (
        `👋 ¡Hola! Soy ComunIAssistant, tu asistente virtual para gestión comunitaria.\n\n` +
        `Puedo ayudarte con información sobre:\n` +
        `• 🏢 Espacios comunes y sus horarios\n` +
        `• 📢 Avisos comunitarios\n` +
        `• 💰 Gastos comunes\n` +
        `• 👥 Visitantes\n` +
        `• 📦 Encomiendas\n\n` +
        `💡 *Usa palabras clave específicas para obtener información actualizada.*`
      );
    }

    if (
      lowerQuestion.includes('buenos días') ||
      lowerQuestion.includes('buenas tardes') ||
      lowerQuestion.includes('buenas noches')
    ) {
      return (
        `🌅 ¡Buenos días! Soy ComunIAssistant, tu asistente virtual.\n\n` +
        `Estoy aquí para ayudarte con la gestión de tu comunidad:\n` +
        `• 🏢 Consulta "espacios comunes" para horarios\n` +
        `• 📢 Consulta "avisos" para comunicados\n` +
        `• 💰 Consulta "gastos comunes" para cuotas\n` +
        `• 👥 Consulta "visitantes" para registros\n` +
        `• 📦 Consulta "encomiendas" para paquetes\n\n` +
        `💡 *¿En qué puedo ayudarte hoy?*`
      );
    }

    // Despedidas y agradecimientos - Dejamos que la IA responda naturalmente
    // Removido para permitir respuestas más naturales de la IA

    // Ayuda - Respuesta instantánea
    if (
      lowerQuestion.includes('ayuda') ||
      lowerQuestion.includes('help') ||
      lowerQuestion.includes('comandos')
    ) {
      return (
        `🆘 **Centro de Ayuda - ComunIAssistant**\n\n` +
        `**Comandos disponibles:**\n` +
        `• "espacios comunes" - Información sobre áreas compartidas\n` +
        `• "avisos" - Últimos comunicados\n` +
        `• "gastos comunes" - Información sobre cuotas\n` +
        `• "visitantes" - Registro de visitas\n` +
        `• "encomiendas" - Estado de paquetes\n\n` +
        `**Para usuarios autenticados:**\n` +
        `• Usa el endpoint '/chatbot/auth' para respuestas personalizadas según tu rol\n` +
        `• Las respuestas se adaptan a tus permisos específicos\n\n` +
        `💡 *Solo escribe la palabra clave que te interesa para obtener información específica.*`
      );
    }

    // Estado del sistema - Respuesta instantánea
    if (
      lowerQuestion.includes('estado') ||
      lowerQuestion.includes('status') ||
      lowerQuestion.includes('funcionando')
    ) {
      return (
        `✅ **Estado del Sistema - ComunIAssistant**\n\n` +
        `🟢 **Sistema operativo** - Todo funcionando correctamente\n` +
        `🟢 **Base de datos** - Conectada y actualizada\n` +
        `🟢 **Servicios** - Disponibles 24/7\n\n` +
        `💡 *Puedes usar cualquier comando para obtener información específica.*`
      );
    }

    return null; // No es una respuesta rápida
  }

  private getQuickResponseWithUserContext(lowerQuestion: string, user: any): string | null {
    const userRoles = user.roles?.map((role: any) => role.name || role.role?.name) || [];
    const roleDisplayName = this.getUserRoleDisplayName(userRoles);
    const userName = user.name || 'Usuario';

    // Saludos personalizados - Respuestas instantáneas
    if (
      lowerQuestion.includes('hola') ||
      lowerQuestion.includes('hi') ||
      lowerQuestion.includes('hey')
    ) {
      return (
        `👋 ¡Hola ${userName}! Soy ComunIAssistant, tu asistente virtual personalizado.\n\n` +
        `👤 **Tu rol:** ${roleDisplayName}\n` +
        `🎯 **Funcionalidades disponibles para ti:**\n` +
        `• 🏢 Espacios comunes y reservas\n` +
        `• 📢 Avisos comunitarios\n` +
        `• 💰 Gastos comunes\n` +
        `• 👥 Gestión de visitantes\n` +
        `• 📦 Encomiendas\n\n` +
        `💡 *Las respuestas se adaptan a tus permisos específicos como ${roleDisplayName}.*`
      );
    }

    if (
      lowerQuestion.includes('buenos días') ||
      lowerQuestion.includes('buenas tardes') ||
      lowerQuestion.includes('buenas noches')
    ) {
      return (
        `🌅 ¡Buenos días ${userName}! Soy ComunIAssistant.\n\n` +
        `👤 **Vista personalizada para:** ${roleDisplayName}\n` +
        `🎯 **Comandos disponibles:**\n` +
        `• "espacios comunes" - Horarios y disponibilidad\n` +
        `• "avisos" - Comunicados de tu comunidad\n` +
        `• "gastos comunes" - Cuotas y gastos\n` +
        `• "visitantes" - Registro de visitas\n` +
        `• "encomiendas" - Estado de paquetes\n\n` +
        `💡 *¿En qué puedo ayudarte hoy como ${roleDisplayName}?*`
      );
    }

    // Despedidas y agradecimientos - Dejamos que la IA responda naturalmente
    // Removido para permitir respuestas más naturales de la IA

    // Ayuda personalizada - Respuesta instantánea
    if (
      lowerQuestion.includes('ayuda') ||
      lowerQuestion.includes('help') ||
      lowerQuestion.includes('comandos')
    ) {
      return (
        `🆘 **Centro de Ayuda Personalizado - ComunIAssistant**\n\n` +
        `👤 **Usuario:** ${userName}\n` +
        `🎭 **Rol:** ${roleDisplayName}\n\n` +
        `**Comandos disponibles:**\n` +
        `• "espacios comunes" - Información según tus permisos\n` +
        `• "avisos" - Comunicados de tu comunidad\n` +
        `• "gastos comunes" - Cuotas y gastos\n` +
        `• "visitantes" - Gestión según tu rol\n` +
        `• "encomiendas" - Estado de paquetes\n\n` +
        `💡 *Las respuestas se adaptan automáticamente a tus permisos como ${roleDisplayName}.*`
      );
    }

    // Estado personalizado - Respuesta instantánea
    if (
      lowerQuestion.includes('estado') ||
      lowerQuestion.includes('status') ||
      lowerQuestion.includes('funcionando')
    ) {
      return (
        `✅ **Estado del Sistema - ComunIAssistant**\n\n` +
        `👤 **Usuario:** ${userName}\n` +
        `🎭 **Rol:** ${roleDisplayName}\n\n` +
        `🟢 **Sistema operativo** - Todo funcionando correctamente\n` +
        `🟢 **Base de datos** - Conectada y actualizada\n` +
        `🟢 **Servicios** - Disponibles 24/7\n` +
        `🟢 **Permisos** - Configurados según tu rol\n\n` +
        `💡 *Puedes usar cualquier comando para obtener información específica de tu comunidad.*`
      );
    }

    return null; // No es una respuesta rápida
  }

  // === MÉTODOS PARA MANEJO DE RATE LIMITING Y CACHE ===

  private isRateLimited(): boolean {
    const now = Date.now();

    // Limpiar timestamps antiguos
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.RATE_LIMIT_WINDOW,
    );

    return this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE;
  }

  private addRequestTimestamp(): void {
    this.requestTimestamps.push(Date.now());
  }

  private getCachedResponse(question: string): string | null {
    const cacheKey = question.toLowerCase().trim();
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for question: ${question.substring(0, 50)}...`);
      return cached.answer;
    }

    // Limpiar cache expirado
    if (cached) {
      this.responseCache.delete(cacheKey);
    }

    return null;
  }

  private setCachedResponse(question: string, answer: string): void {
    const cacheKey = question.toLowerCase().trim();
    this.responseCache.set(cacheKey, {
      answer,
      timestamp: Date.now(),
    });

    // Limitar tamaño del cache
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  private getFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase().trim();

    // Respuestas de fallback para preguntas comunes
    if (
      lowerQuestion.includes('hola') ||
      lowerQuestion.includes('buenos días') ||
      lowerQuestion.includes('buenas tardes')
    ) {
      return (
        `👋 ¡Hola! Soy ComunIAssistant, tu asistente virtual para gestión comunitaria.\n\n` +
        `Puedo ayudarte con información sobre:\n` +
        `• 🏢 Espacios comunes y sus horarios\n` +
        `• 📢 Avisos comunitarios\n` +
        `• 💰 Gastos comunes\n` +
        `• 👥 Visitantes\n` +
        `• 📦 Encomiendas\n\n` +
        `💡 *Nota: El servicio de IA está temporalmente limitado. Usa palabras clave específicas para obtener información actualizada.*`
      );
    }

    if (
      lowerQuestion.includes('gracias') ||
      lowerQuestion.includes('chao') ||
      lowerQuestion.includes('adiós')
    ) {
      return (
        `👋 ¡De nada! Estoy aquí para ayudarte con cualquier consulta sobre tu comunidad.\n\n` +
        `💡 *Recuerda que puedes usar palabras clave como "espacios comunes", "avisos", "gastos comunes" para obtener información específica.*`
      );
    }

    if (lowerQuestion.includes('ayuda') || lowerQuestion.includes('help')) {
      return (
        `🆘 **Centro de Ayuda - ComunIAssistant**\n\n` +
        `**Comandos disponibles:**\n` +
        `• "espacios comunes" - Información sobre áreas compartidas\n` +
        `• "avisos" - Últimos comunicados\n` +
        `• "gastos comunes" - Información sobre cuotas\n` +
        `• "visitantes" - Registro de visitas\n` +
        `• "encomiendas" - Estado de paquetes\n\n` +
        `**Para usuarios autenticados:**\n` +
        `• Usa el endpoint '/chatbot/auth' para respuestas personalizadas según tu rol\n` +
        `• Las respuestas se adaptan a tus permisos específicos\n\n` +
        `💡 *El servicio de IA está temporalmente limitado. Usa comandos específicos para mejor experiencia.*`
      );
    }

    // Respuesta genérica de fallback
    return (
      `🤖 **ComunIAssistant**\n\n` +
      `El servicio de IA está temporalmente limitado debido a restricciones de velocidad.\n\n` +
      `**Para obtener información específica, usa estos comandos:**\n` +
      `• "espacios comunes" - Horarios y disponibilidad\n` +
      `• "avisos" - Comunicados recientes\n` +
      `• "gastos comunes" - Cuotas y gastos\n` +
      `• "visitantes" - Registro de visitas\n` +
      `• "encomiendas" - Estado de paquetes\n\n` +
      `💡 *Si eres usuario autenticado, usa el endpoint '/chatbot/auth' para respuestas personalizadas.*\n` +
      `⏰ *El servicio completo estará disponible nuevamente en unos minutos.*`
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
