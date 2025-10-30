import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

import { ChatbotResponseDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  // Cache para respuestas frecuentes y control de rate limiting inteligente
  private responseCache = new Map<string, { answer: string; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Control inteligente de rate limiting para OpenAI
  private lastRequestTime: number = 0;
  private readonly MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 segundo mínimo entre requests

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Verificar configuración de OpenAI al inicializar
    this.verifyOpenAIConfiguration().then((isConfigured) => {
      if (isConfigured) {
        this.logger.log('🚀 Chatbot service initialized with OpenAI');
      } else {
        this.logger.warn('⚠️ Chatbot service initialized but OpenAI not configured');
      }
    });
  }

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
    if (
      this.matchesKeywords(lowerQuestion, [
        'espacios comunes',
        'espacios',
        'salon',
        'gym',
        'piscina',
        'cancha',
        'jardin',
        'terraza',
      ])
    ) {
      return await this.getCommonSpacesInfo();
    }

    // --- 2) AVISOS COMUNITARIOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'avisos',
        'comunicados',
        'noticias',
        'anuncios',
        'informacion',
      ])
    ) {
      return await this.getCommunityAnnouncements();
    }

    // --- 3) GASTOS COMUNES ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'gastos comunes',
        'gastos',
        'cuotas',
        'pagos',
        'facturas',
        'cobros',
        'administracion',
      ])
    ) {
      return await this.getCommonExpensesInfo();
    }

    // --- 3.1) CONSULTAS ESPECÍFICAS SOBRE DEUDAS (PÚBLICO) ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'plata',
        'dinero',
        'debo',
        'deuda',
        'deudas',
        'pendiente',
        'pendientes',
        'adeudo',
        'adeudos',
        'cuanto debo',
        'cuanta plata',
        'cuanto dinero',
        'monto',
        'montos',
        'cuanto tengo que pagar',
        'cuanto debo pagar',
        'estado de pagos',
        'mis pagos',
      ])
    ) {
      return {
        answer:
          '💰 Consulta sobre Deudas\n\n❌ Para consultar tus gastos pendientes, necesitas estar autenticado.\n\n💡 *Inicia sesión para ver el estado de tus pagos específicos.*',
      };
    }

    // --- 4) RESIDENTES ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'residentes',
        'residente',
        'vecinos',
        'habitantes',
        'propietarios',
      ])
    ) {
      return await this.getResidentsInfo();
    }

    // --- 5) VISITANTES ---
    if (
      this.matchesKeywords(lowerQuestion, ['visitantes', 'visitas', 'invitados', 'acompanantes'])
    ) {
      return await this.getVisitorsInfo();
    }

    // --- 6) ENCOMIENDAS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'encomiendas',
        'paquetes',
        'correo',
        'delivery',
        'envios',
        'recepcion',
      ])
    ) {
      return await this.getParcelsInfo();
    }

    // --- 7) INGRESOS COMUNITARIOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'ingresos',
        'rentas',
        'alquileres',
        'ventas',
        'finanzas',
      ])
    ) {
      return await this.getCommunityIncomeInfo();
    }

    // --- 8) CATEGORÍAS DE GASTOS ---
    if (this.matchesKeywords(lowerQuestion, ['categorias', 'tipos de gastos', 'clasificacion'])) {
      return await this.getExpenseCategoriesInfo();
    }

    // --- 9) UNIDADES Y APARTAMENTOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'unidades',
        'apartamentos',
        'departamentos',
        'pisos',
        'torres',
      ])
    ) {
      return await this.getUnitsInfo();
    }

    // --- 10) CONSULTA AL MODELO DE OPENAI ---
    return await this.queryOpenAI(question);
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

    // --- 0.5) DETECCIÓN DE PREGUNTAS SOBRE "CÓMO USAR" FUNCIONALIDADES ---
    // Si el usuario pregunta cómo usar algo, explicamos sin consultar BD
    // Si pregunta directamente por datos (muéstrame, quiero ver), consultamos BD
    const isHowToQuestion = this.isHowToQuestion(lowerQuestion);
    const isDataRequest = this.isDataRequest(lowerQuestion);

    // Si es pregunta de "cómo usar" y NO es pregunta directa de datos, dar explicación
    if (isHowToQuestion && !isDataRequest) {
      const functionality = this.detectFunctionalityFromQuestion(lowerQuestion);
      if (functionality) {
        const explanation = await this.getHowToExplanation(functionality, userInfo, userRoles);
        if (explanation) {
          return explanation;
        }
        // Si no hay explicación específica, continúa con el flujo normal
      }
    }

    // --- 1) ESPACIOS COMUNES ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'espacios comunes',
        'espacios',
        'salon',
        'gym',
        'piscina',
        'cancha',
        'jardin',
        'terraza',
      ])
    ) {
      return await this.getCommonSpacesInfoForUser(userInfo, userRoles);
    }

    // --- 2) AVISOS COMUNITARIOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'avisos',
        'comunicados',
        'noticias',
        'anuncios',
        'informacion',
      ])
    ) {
      return await this.getCommunityAnnouncementsForUser(userInfo, userRoles);
    }

    // --- 3) GASTOS COMUNES ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'gastos comunes',
        'gastos',
        'cuotas',
        'pagos',
        'facturas',
        'cobros',
        'administracion',
      ])
    ) {
      return await this.getCommonExpensesInfoForUser(userInfo, userRoles);
    }

    // --- 3.1) CONSULTAS ESPECÍFICAS SOBRE DEUDAS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'plata',
        'dinero',
        'debo',
        'deuda',
        'deudas',
        'pendiente',
        'pendientes',
        'adeudo',
        'adeudos',
        'cuanto debo',
        'cuanta plata',
        'cuanto dinero',
        'monto',
        'montos',
        'cuanto tengo que pagar',
        'cuanto debo pagar',
        'estado de pagos',
        'mis pagos',
      ])
    ) {
      return await this.getDebtInfoForUser(userInfo, userRoles);
    }

    // --- 4) RESIDENTES ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'residentes',
        'residente',
        'vecinos',
        'habitantes',
        'propietarios',
      ])
    ) {
      return await this.getResidentsInfoForUser(userInfo, userRoles);
    }

    // --- 5) VISITANTES ---
    if (
      this.matchesKeywords(lowerQuestion, ['visitantes', 'visitas', 'invitados', 'acompanantes'])
    ) {
      return await this.getVisitorsInfoForUser(userInfo, userRoles);
    }

    // --- 6) ENCOMIENDAS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'encomiendas',
        'paquetes',
        'correo',
        'delivery',
        'envios',
        'recepcion',
      ])
    ) {
      return await this.getParcelsInfoForUser(userInfo, userRoles);
    }

    // --- 7) INGRESOS COMUNITARIOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'ingresos',
        'rentas',
        'alquileres',
        'ventas',
        'finanzas',
      ])
    ) {
      return await this.getCommunityIncomeInfoForUser(userInfo, userRoles);
    }

    // --- 8) CATEGORÍAS DE GASTOS ---
    if (this.matchesKeywords(lowerQuestion, ['categorias', 'tipos de gastos', 'clasificacion'])) {
      return await this.getExpenseCategoriesInfoForUser(userInfo, userRoles);
    }

    // --- 9) UNIDADES Y APARTAMENTOS ---
    if (
      this.matchesKeywords(lowerQuestion, [
        'unidades',
        'apartamentos',
        'departamentos',
        'pisos',
        'torres',
      ])
    ) {
      return await this.getUnitsInfoForUser(userInfo, userRoles);
    }

    // --- 10) CONSULTA AL MODELO DE OPENAI CON CONTEXTO DE USUARIO ---
    return await this.queryOpenAIWithUserContext(question, userInfo, userRoles);
  }

  // Método auxiliar para verificar si una pregunta coincide con palabras clave
  private matchesKeywords(question: string, keywords: string[]): boolean {
    return keywords.some((keyword) => question.includes(keyword));
  }

  /**
   * Detecta si la pregunta es sobre "cómo usar" o "cómo hacer" algo (explicación)
   * vs una solicitud directa de datos
   */
  private isHowToQuestion(question: string): boolean {
    const howToKeywords = [
      'como',
      'cómo',
      'como puedo',
      'cómo puedo',
      'como hacer',
      'cómo hacer',
      'explicame',
      'explícame',
      'explicar',
      'explica',
      'como funciona',
      'cómo funciona',
      'como se',
      'cómo se',
      'pasos para',
      'paso a paso',
      'tutorial',
      'instrucciones',
      'ayuda con',
      'como usar',
      'cómo usar',
      'como debo',
      'cómo debo',
      'que tengo que hacer',
      'qué tengo que hacer',
      'proceso para',
      'guía',
      'manual',
    ];
    return howToKeywords.some((keyword) => question.includes(keyword));
  }

  /**
   * Detecta si la pregunta es una solicitud directa de datos (no explicación)
   */
  private isDataRequest(question: string): boolean {
    const dataRequestKeywords = [
      'muestrame',
      'muéstrame',
      'muestra',
      'quiero ver',
      'dame',
      'dame los',
      'dame las',
      'ver los',
      'ver las',
      'ver mis',
      'ver mis',
      'cuáles son',
      'cuales son',
      'tengo',
      'hay',
      'existen',
      'lista',
      'listado',
      'listar',
      'consulta',
      'consultar',
      'obtener',
      'traer',
      'mostrar los',
      'mostrar las',
      'mostrar mis',
      'datos de',
      'información de',
      'estado de',
    ];
    return dataRequestKeywords.some((keyword) => question.includes(keyword));
  }

  /**
   * Detecta qué funcionalidad se está preguntando desde la pregunta
   */
  private detectFunctionalityFromQuestion(question: string): string | null {
    const lowerQuestion = question.toLowerCase();

    // Espacios comunes
    if (
      this.matchesKeywords(lowerQuestion, [
        'espacios comunes',
        'espacios',
        'salon',
        'salón',
        'gimnasio',
        'gym',
        'piscina',
        'cancha',
        'jardin',
        'jardín',
        'terraza',
        'reserva',
        'reservas',
      ])
    ) {
      return 'espacios_comunes';
    }

    // Avisos
    if (
      this.matchesKeywords(lowerQuestion, [
        'avisos',
        'aviso',
        'comunicados',
        'comunicado',
        'anuncios',
        'anuncio',
        'noticias',
        'noticia',
      ])
    ) {
      return 'avisos';
    }

    // Gastos comunes
    if (
      this.matchesKeywords(lowerQuestion, [
        'gastos comunes',
        'gastos',
        'gasto',
        'pagos',
        'pago',
        'cuotas',
        'cuota',
        'facturas',
        'factura',
        'deudas',
        'deuda',
      ])
    ) {
      return 'gastos_comunes';
    }

    // Visitantes
    if (
      this.matchesKeywords(lowerQuestion, [
        'visitantes',
        'visitante',
        'visitas',
        'visita',
        'invitados',
        'invitado',
      ])
    ) {
      return 'visitantes';
    }

    // Encomiendas
    if (
      this.matchesKeywords(lowerQuestion, [
        'encomiendas',
        'encomienda',
        'paquetes',
        'paquete',
        'envíos',
        'envios',
        'envio',
      ])
    ) {
      return 'encomiendas';
    }

    // Reservas
    if (
      this.matchesKeywords(lowerQuestion, [
        'reservas',
        'reserva',
        'reservar',
        'calendario',
        'agenda',
      ])
    ) {
      return 'reservas';
    }

    // Residentes
    if (
      this.matchesKeywords(lowerQuestion, [
        'residentes',
        'residente',
        'vecinos',
        'vecino',
        'habitantes',
        'habitante',
        'propietarios',
        'propietario',
      ])
    ) {
      return 'residentes';
    }

    // Incidencias
    if (
      this.matchesKeywords(lowerQuestion, [
        'incidencias',
        'incidencia',
        'problemas',
        'problema',
        'reportar',
        'reporte',
      ])
    ) {
      return 'incidencias';
    }

    // Ingresos (solo admins)
    if (
      this.matchesKeywords(lowerQuestion, [
        'ingresos',
        'ingreso',
        'rentas',
        'renta',
        'alquileres',
        'alquiler',
      ])
    ) {
      return 'ingresos';
    }

    // Organizaciones (solo super admin)
    if (this.matchesKeywords(lowerQuestion, ['organizaciones', 'organización', 'organizacion'])) {
      return 'organizaciones';
    }

    // Métricas (solo super admin)
    if (
      this.matchesKeywords(lowerQuestion, [
        'metricas',
        'métricas',
        'estadisticas',
        'estadísticas',
        'reportes',
        'reporte',
      ])
    ) {
      return 'metricas';
    }

    return null;
  }

  /**
   * Proporciona explicaciones sobre cómo usar funcionalidades según el rol del usuario
   */
  private async getHowToExplanation(
    functionality: string,
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto | null> {
    const userName = userInfo?.name || 'Usuario';
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
    const isConcierge = userRoles.includes('CONCIERGE');
    const isResident =
      userRoles.includes('RESIDENT') || userRoles.includes('OWNER') || userRoles.includes('TENANT');

    switch (functionality) {
      case 'espacios_comunes':
        if (isSuperAdmin) {
          return {
            answer: `🏢 **Cómo gestionar Espacios Comunes - Super Administrador**

Como Super Administrador, puedes crear, registrar y gestionar espacios comunes de todas las comunidades del sistema.

**📋 Funcionalidades disponibles:**
• Ver todos los espacios comunes del sistema
• Crear/Registrar nuevos espacios comunes en cualquier comunidad
• Editar y eliminar espacios comunes existentes
• Gestionar horarios y disponibilidad de espacios
• Ver todas las reservas de espacios comunes
• Configurar características de cada espacio

**🎯 Pasos para crear/registrar un espacio común:**
1. Desde el panel: **Super Administración → Espacios Comunes → Crear Nuevo**
2. Completa el formulario:
   - Nombre del espacio (ej: "Salón de Eventos", "Gimnasio", "Piscina")
   - Comunidad a la que pertenece
   - Descripción del espacio
   - Capacidad máxima (número de personas)
   - Características y equipamiento disponible
3. Configura horarios:
   - Define días y horarios de disponibilidad
   - Establece si requiere reserva previa
   - Define tiempo mínimo/máximo de reserva
4. Activa el espacio y guarda
5. Los residentes podrán ver y reservar este espacio inmediatamente

**🎯 Para consultar:**
• Ver espacios: Escribe "espacios comunes" para ver todos los espacios del sistema
• Ver reservas: Escribe "reservas" para ver todas las reservas activas

**💡 Tip:** Escribe "muéstrame los espacios comunes" para ver datos reales de la base de datos.`,
          };
        } else if (isCommunityAdmin) {
          return {
            answer: `🏢 **Cómo gestionar Espacios Comunes - Administrador de Comunidad**

Como Administrador de Comunidad, puedes crear, registrar y gestionar completamente los espacios comunes de tus comunidades.

**📋 Funcionalidades disponibles:**
• Ver y gestionar espacios comunes de tus comunidades
• Crear/Registrar nuevos espacios comunes (salón, gimnasio, piscina, etc.)
• Editar espacios existentes
• Configurar horarios de disponibilidad para cada espacio
• Activar/desactivar espacios según necesidades
• Ver todas las reservas de tus comunidades
• Aprobar o rechazar reservas pendientes

**🎯 Pasos para crear/registrar un nuevo espacio común:**
1. Desde el panel: **Administración → Gestión de Comunidad → Espacios Comunes → Crear Nuevo**
2. Completa el formulario:
   - Nombre del espacio (ej: "Salón de Eventos", "Gimnasio Central")
   - Descripción del espacio y características
   - Capacidad máxima de personas
   - Equipamiento disponible (si aplica)
3. Configura disponibilidad:
   - Define días y horarios de operación
   - Establece si requiere aprobación para reservas
   - Configura tiempo mínimo/máximo de reserva
   - Define políticas de uso
4. Revisa y activa el espacio
5. Guarda y los residentes podrán verlo y reservarlo

**🎯 Para consultar:**
• Ver espacios: Escribe "espacios comunes" para ver todos los espacios de tus comunidades
• Ver reservas: Escribe "reservas" para ver reservas activas y pendientes

**💡 Tip:** Escribe "muéstrame los espacios comunes" o "quiero ver las reservas" para ver datos específicos.`,
          };
        } else if (isConcierge) {
          return {
            answer: `🏢 **Cómo gestionar Espacios Comunes - Conserje**

Como Conserje, puedes consultar y gestionar información operativa sobre espacios comunes de tu comunidad.

**📋 Funcionalidades disponibles:**
• Ver espacios comunes disponibles de tu comunidad
• Consultar horarios y disponibilidad
• Ver reservas programadas
• Verificar qué espacios están reservados y por quién

**🎯 Pasos para usar:**
1. **Ver espacios:** Escribe "espacios comunes" para ver los espacios de tu comunidad con sus horarios
2. **Ver reservas:** Escribe "reservas" para ver qué espacios están reservados y cuándo
3. **Consultar disponibilidad:** Puedes preguntar "¿qué espacios están disponibles hoy?"

**💡 Tip:** Escribe "muéstrame las reservas" para ver datos específicos de la base de datos.`,
          };
        } else if (isResident) {
          return {
            answer: `🏢 **Cómo usar Espacios Comunes - Residente**

Como Residente, puedes ver espacios disponibles y crear reservas para tu comunidad.

**📋 Funcionalidades disponibles:**
• Ver espacios comunes disponibles de tu comunidad
• Consultar horarios de cada espacio
• Crear reservas de espacios comunes
• Ver tus reservas activas y pasadas
• Cancelar reservas si es necesario

**🎯 Pasos para usar:**
1. **Ver espacios disponibles:** Escribe "espacios comunes" para ver todos los espacios y sus horarios
2. **Crear una reserva:** Desde la interfaz, ve a Espacios Comunes → Selecciona un espacio → Elige fecha y hora
3. **Ver mis reservas:** Escribe "reservas" o accede a tu perfil → Mis Reservas

**💡 Tip:** Para ver tus reservas específicas, escribe "muéstrame mis reservas" o "quiero ver mis reservas".`,
          };
        }
        break;

      case 'avisos':
        if (isSuperAdmin || isCommunityAdmin) {
          return {
            answer: `📢 **Cómo gestionar Avisos Comunitarios - Administrador**

Como Administrador, puedes crear, registrar y gestionar avisos para comunicarte con los residentes.

**📋 Funcionalidades disponibles:**
• Crear/Registrar nuevos avisos (generales, urgentes, mantenimiento, seguridad, sociales)
• Editar avisos existentes
• Activar/desactivar avisos
• Ver todos los avisos de tus comunidades
• Publicar avisos inmediatamente o programarlos

**🎯 Pasos para crear/registrar un aviso:**
1. Desde el panel de administración: **Avisos → Crear Nuevo Aviso**
2. Completa el formulario:
   - Selecciona el tipo de aviso (General, Urgente, Mantenimiento, Seguridad, Social, etc.)
   - Escribe un título descriptivo
   - Escribe el contenido del aviso (descripción detallada)
   - Selecciona la comunidad de destino (si administras varias)
3. Configura la publicación:
   - Publica inmediatamente: El aviso se publica al guardar
   - Programa para más tarde: Selecciona fecha y hora de publicación
4. Opcional: Adjunta archivos o imágenes si es necesario
5. Guarda el aviso

**💡 Consejos:**
• Los avisos urgentes aparecen destacados y generan notificaciones a los residentes
• Puedes editar o desactivar avisos después de crearlos
• Los residentes verán los avisos en su dashboard y recibirán notificaciones de los importantes

**💡 Para ver avisos existentes:** Escribe "muéstrame los avisos" o "quiero ver los avisos".`,
          };
        } else {
          return {
            answer: `📢 **Cómo ver Avisos Comunitarios - Residente/Conserje**

Puedes ver los avisos y comunicados de tu comunidad. Solo los Administradores pueden crear/registrar nuevos avisos.

**📋 Funcionalidades disponibles:**
• Ver avisos recientes de tu comunidad
• Filtrar por tipo de aviso (General, Urgente, Mantenimiento, etc.)
• Recibir notificaciones de avisos importantes
• Consultar historial de avisos

**🎯 Pasos para ver avisos:**
1. **Desde el chatbot:** Escribe "avisos" o "muéstrame los avisos" para ver los más recientes
2. **Desde la interfaz:** Sección de Avisos en el dashboard principal
3. **Notificaciones:** Los avisos urgentes aparecen destacados y generan notificaciones

**📝 Nota importante:** 
• Solo los Administradores de Comunidad pueden crear/registrar nuevos avisos
• Si necesitas que se publique un aviso, contacta a tu administrador de comunidad

**💡 Tip:** Escribe "muéstrame los avisos" para ver datos reales de avisos de la base de datos.`,
          };
        }

      case 'gastos_comunes':
        if (isResident) {
          return {
            answer: `💰 **Cómo ver tus Gastos Comunes - Residente**

Puedes consultar tus gastos comunes y estado de pagos.

**📋 Funcionalidades disponibles:**
• Ver gastos comunes de tus unidades
• Consultar cuánto debes
• Ver historial de pagos realizados
• Ver detalles de cada gasto (categoría, monto, fecha de vencimiento)

**🎯 Pasos para usar:**
1. **Ver mis gastos:** Escribe "gastos comunes" o "mis gastos"
2. **Consultar deudas:** Escribe "cuanto debo" para ver el total adeudado
3. **Ver detalles:** Escribe "muéstrame mis gastos" para ver datos específicos
4. **Desde la interfaz:** Dashboard → Gastos Comunes → Mis Gastos

**💡 Tip:** Escribe "muéstrame mis gastos" o "quiero ver cuánto debo" para obtener datos reales de la base de datos.`,
          };
        } else if (isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `💰 **Cómo gestionar Gastos Comunes - Administrador**

Como Administrador, puedes crear, registrar y gestionar gastos comunes de tus comunidades.

**📋 Funcionalidades disponibles:**
• Crear/Registrar nuevos gastos comunes para la comunidad
• Asignar gastos a unidades específicas o a todas
• Ver gastos pendientes de todas las unidades
• Gestionar categorías de gastos (mantenimiento, servicios, administración, etc.)
• Ver reportes financieros de la comunidad
• Editar y anular gastos según sea necesario

**🎯 Pasos para crear/registrar un gasto común:**
1. Desde el panel: **Administración → Gastos Comunes → Crear Nuevo**
2. Completa el formulario:
   - Selecciona la categoría del gasto (Mantenimiento, Servicios, Administración, etc.)
   - Ingresa el monto total
   - Fecha de vencimiento para el pago
   - Descripción del gasto (opcional pero recomendado)
3. Asignación:
   - Asigna a unidades específicas (selecciona las unidades)
   - O asigna a todas las unidades automáticamente
4. Revisa la información y guarda
5. El sistema notificará automáticamente a los residentes afectados

**💡 Consejos:**
• Los gastos se distribuyen según los coeficientes de cada unidad
• Puedes ver el estado de pago de cada unidad después de crear el gasto
• Los residentes recibirán notificaciones cuando se registre un nuevo gasto

**💡 Tip:** Para ver datos específicos, escribe "muéstrame los gastos comunes" o "quiero ver las deudas pendientes".`,
          };
        }
        break;

      case 'visitantes':
        if (isResident) {
          return {
            answer: `👥 **Cómo gestionar Visitantes - Residente**

Puedes registrar/crear visitantes para tus unidades.

**📋 Funcionalidades disponibles:**
• Registrar/Crear visitantes antes de su llegada
• Ver tus visitantes registrados y su estado
• Actualizar información de visitantes existentes
• Ver historial de visitantes anteriores
• Consultar estado de visitantes en tiempo real

**🎯 Pasos para registrar/crear un visitante:**
1. Desde la interfaz: **Dashboard → Visitantes → Registrar Nuevo**
2. Completa el formulario:
   - Nombre completo del visitante
   - Número de documento/identificación
   - Teléfono de contacto
   - Propósito de la visita
   - Fecha y hora esperada de llegada
   - Unidad de destino (selecciona de tus unidades)
3. Revisa la información y guarda el registro
4. El conserje recibirá una notificación automática

**💡 Tip:** Para ver tus visitantes, escribe "muéstrame mis visitantes" o "quiero ver mis visitantes registrados".`,
          };
        } else if (isConcierge) {
          return {
            answer: `👥 **Cómo gestionar Visitantes - Conserje**

Como Conserje, gestionas el registro operativo de visitantes de tu comunidad.

**📋 Funcionalidades disponibles:**
• Ver todos los visitantes registrados de la comunidad
• Actualizar estado de visitantes (Registrado → Ingresó → Salió)
• Verificar identificación de visitantes
• Consultar visitantes programados para el día

**🎯 Pasos para gestionar visitantes:**
1. **Ver visitantes del día:** Escribe "visitantes" o "muéstrame los visitantes"
2. **Cuando llega un visitante:** Actualiza el estado a "Ingresó"
3. **Cuando sale:** Actualiza el estado a "Salió"
4. Desde la interfaz: Sección de Visitantes → Gestionar

**💡 Tip:** Escribe "muéstrame los visitantes de hoy" para ver datos específicos.`,
          };
        } else if (isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `👥 **Cómo gestionar Visitantes - Administrador**

Puedes ver y gestionar visitantes de tus comunidades.

**📋 Funcionalidades disponibles:**
• Ver todos los visitantes de tus comunidades
• Consultar registro de visitantes por unidad
• Ver estadísticas de visitantes
• Gestionar permisos de registro de visitantes

**🎯 Pasos para usar:**
1. **Ver visitantes:** Escribe "visitantes" o "muéstrame los visitantes"
2. **Consultar por unidad:** Puedes filtrar visitantes por unidad específica
3. Desde la interfaz: Panel → Gestión de Comunidad → Visitantes

**💡 Tip:** Escribe "muéstrame los visitantes" para ver datos reales de la base de datos.`,
          };
        }
        break;

      case 'encomiendas':
        if (isResident) {
          return {
            answer: `📦 **Cómo ver tus Encomiendas - Residente**

Puedes ver las encomiendas recibidas en tus unidades. Solo el Conserje puede registrar nuevas encomiendas cuando llegan.

**📋 Funcionalidades disponibles:**
• Ver encomiendas recibidas en tus unidades
• Consultar estado de paquetes (recibido, retirado)
• Ver fecha de recepción de cada encomienda
• Recibir notificaciones cuando llegue una nueva encomienda

**🎯 Pasos para usar:**
1. **Ver mis encomiendas:** Escribe "encomiendas" o "mis encomiendas"
2. **Consultar datos:** Escribe "muéstrame mis encomiendas" para ver datos específicos
3. **Desde la interfaz:** Dashboard → Encomiendas
4. Cuando recibas una notificación, puedes ver los detalles del paquete

**📝 Nota importante:** 
• El Conserje registra las encomiendas cuando llegan al edificio
• Recibirás una notificación cuando tengas una nueva encomienda
• Debes retirar tus paquetes en el plazo establecido

**💡 Tip:** Para ver datos específicos, escribe "muéstrame mis encomiendas" o "quiero ver mis paquetes".`,
          };
        } else if (isConcierge) {
          return {
            answer: `📦 **Cómo gestionar Encomiendas - Conserje**

Como Conserje, puedes registrar, crear y gestionar encomiendas en tu comunidad.

**📋 Funcionalidades disponibles:**
• Registrar/Crear nuevas encomiendas cuando llegan
• Ver todas las encomiendas recibidas en la comunidad
• Actualizar estado de encomiendas (Recibido → Retirado)
• Consultar encomiendas pendientes de retiro
• Notificar a residentes cuando llegue una encomienda

**🎯 Pasos para registrar/crear una encomienda:**
1. **Cuando llega una encomienda al edificio:**
   - Desde la interfaz: **Sección de Encomiendas → Registrar Nueva**
   - O desde el chatbot: Puedes usar la consulta rápida
2. **Completa el formulario:**
   - Nombre del destinatario (residente)
   - Unidad de destino
   - Empresa de envío (si aplica)
   - Número de rastreo (si está disponible)
   - Descripción del paquete (tamaño, tipo)
   - Fecha y hora de recepción
3. **Guarda el registro:**
   - El sistema notificará automáticamente al residente
   - El estado inicial será "Recibido"

**🎯 Para gestionar encomiendas existentes:**
1. **Ver encomiendas pendientes:** Escribe "encomiendas" o "muéstrame las encomiendas"
2. **Cuando un residente retira:** 
   - Actualiza el estado a "Retirado"
   - Registra la fecha y hora de retiro
3. **Consultar por unidad:** Puedes filtrar encomiendas por unidad específica

**💡 Consejos:**
• Registra las encomiendas inmediatamente al recibirlas
• Notifica a los residentes para que retiren sus paquetes
• Mantén un registro ordenado facilitará la gestión

**💡 Tip:** Escribe "muéstrame las encomiendas pendientes" para ver datos específicos.`,
          };
        } else if (isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `📦 **Cómo gestionar Encomiendas - Administrador**

Puedes ver y gestionar encomiendas de tus comunidades.

**📋 Funcionalidades disponibles:**
• Ver todas las encomiendas de tus comunidades
• Consultar encomiendas por unidad
• Ver estadísticas de encomiendas recibidas y retiradas

**🎯 Pasos para usar:**
1. **Ver encomiendas:** Escribe "encomiendas" o "muéstrame las encomiendas"
2. **Consultar por unidad:** Puedes filtrar por unidad específica
3. Desde la interfaz: Panel → Gestión de Comunidad → Encomiendas

**💡 Tip:** Escribe "muéstrame las encomiendas" para ver datos reales de la base de datos.`,
          };
        }
        break;

      case 'reservas':
        if (isResident) {
          return {
            answer: `📅 **Cómo hacer Reservas de Espacios Comunes - Residente**

Puedes crear/registrar reservas de espacios comunes de tu comunidad.

**📋 Funcionalidades disponibles:**
• Ver espacios disponibles y sus horarios
• Crear/Registrar nuevas reservas de espacios comunes
• Ver tus reservas activas y pasadas
• Editar reservas existentes (si está permitido)
• Cancelar reservas si es necesario

**🎯 Pasos para crear/registrar una reserva:**
1. **Consulta espacios disponibles:**
   - Escribe "espacios comunes" para ver espacios y horarios disponibles
   - O ve a la interfaz: **Dashboard → Espacios Comunes**
2. **Selecciona el espacio:**
   - Elige el espacio que deseas reservar
   - Revisa los horarios disponibles y restricciones
3. **Completa la reserva:**
   - Selecciona la fecha deseada
   - Elige el horario disponible (hora de inicio y fin)
   - Revisa si hay políticas especiales o costos
4. **Confirma y envía:**
   - Revisa todos los detalles
   - Confirma la reserva
   - Recibirás una confirmación automática
5. Si la reserva requiere aprobación, te llegará una notificación cuando sea aprobada

**💡 Consejos:**
• Reserva con anticipación para asegurar disponibilidad
• Revisa las políticas de uso del espacio antes de reservar
• Puedes cancelar tu reserva si cambias de planes (respetando los plazos)

**💡 Tip:** Para ver tus reservas, escribe "muéstrame mis reservas" o "quiero ver mis reservas".`,
          };
        } else if (isConcierge || isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `📅 **Cómo gestionar Reservas - Administrador/Conserje**

Puedes ver y gestionar reservas de espacios comunes.

**📋 Funcionalidades disponibles:**
• Ver todas las reservas de espacios comunes
• Consultar calendario de reservas
• Aprobar o rechazar reservas (si aplica según tu rol)
• Ver disponibilidad de espacios

**🎯 Pasos para usar:**
1. **Ver reservas:** Escribe "reservas" o "muéstrame las reservas"
2. **Consultar disponibilidad:** Escribe "espacios comunes" para ver horarios
3. Desde la interfaz: Gestión → Reservas

**💡 Tip:** Escribe "muéstrame las reservas" para ver datos específicos de la base de datos.`,
          };
        }
        break;

      case 'incidencias':
        if (isResident) {
          return {
            answer: `🚨 **Cómo reportar Incidencias - Residente**

Puedes crear/registrar reportes de problemas o incidencias en tu comunidad.

**📋 Funcionalidades disponibles:**
• Crear/Registrar reportes de incidencias
• Ver tus incidencias reportadas y su estado actual
• Consultar historial de incidencias resueltas
• Agregar comentarios o actualizaciones a tus reportes

**🎯 Pasos para reportar/crear una incidencia:**
1. Desde la interfaz: **Dashboard → Incidencias → Reportar Nueva**
2. Completa el formulario:
   - Título del problema (ej: "Fuga de agua en pasillo")
   - Descripción detallada del problema
   - Categoría/tipo de incidencia (Mantenimiento, Seguridad, Ruido, etc.)
   - Ubicación específica (si aplica)
   - Adjunta fotos o documentos si es necesario
3. Revisa la información y envía el reporte
4. La administración recibirá una notificación automática
5. Puedes consultar el estado en cualquier momento

**💡 Consejos:**
• Sé específico en la descripción para una resolución más rápida
• Incluye fotos cuando sea posible
• Puedes seguir el estado de tus reportes desde tu dashboard

**💡 Tip:** Para ver tus incidencias, escribe "muéstrame mis incidencias" o "quiero ver mis reportes".`,
          };
        }
        break;

      case 'ingresos':
        if (isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `💵 **Cómo gestionar Ingresos Comunitarios - Administrador**

Como Administrador, puedes registrar, crear y gestionar ingresos de tus comunidades.

**📋 Funcionalidades disponibles:**
• Registrar/Crear ingresos comunitarios (rentas, alquileres, servicios, etc.)
• Ver historial de ingresos por período
• Gestionar categorías de ingresos
• Ver reportes financieros con ingresos
• Exportar reportes de ingresos
• Editar y anular ingresos registrados

**🎯 Pasos para registrar/crear un ingreso:**
1. Desde el panel: **Administración → Ingresos → Crear Nuevo**
2. Completa el formulario:
   - **Categoría del ingreso:**
     * Rentas de espacios comunes
     * Alquileres
     * Servicios adicionales
     * Multas y recargos
     * Otros ingresos
   - **Información del ingreso:**
     * Monto recibido
     * Período de facturación (mes/año)
     * Descripción del ingreso
     * Fecha de recepción
   - **Origen del ingreso:**
     * Unidad específica (si aplica)
     * Fuente del ingreso
3. Revisa la información y guarda
4. El ingreso se registrará en los reportes financieros

**🎯 Para consultar ingresos:**
1. **Ver ingresos:** Escribe "ingresos" o "muéstrame los ingresos"
2. **Consultar por período:** Puedes filtrar por mes, año o rango de fechas
3. **Reportes financieros:** Accede a Reportes → Ingresos para ver análisis detallados

**💡 Consejos:**
• Registra los ingresos tan pronto como se reciban
• Clasifica correctamente cada ingreso para reportes precisos
• Revisa periódicamente los ingresos vs gastos de la comunidad

**💡 Tip:** Para ver datos específicos, escribe "muéstrame los ingresos" o "quiero ver los ingresos del mes".`,
          };
        }
        break;

      case 'residentes':
        if (isCommunityAdmin || isSuperAdmin) {
          return {
            answer: `👥 **Cómo gestionar Residentes - Administrador**

Como Administrador, puedes crear, registrar y gestionar residentes de tus comunidades.

**📋 Funcionalidades disponibles:**
• Crear/Registrar nuevos residentes en tus comunidades
• Editar información de residentes existentes
• Asignar unidades a residentes
• Ver todos los residentes de tus comunidades
• Gestionar roles y permisos de residentes
• Ver unidades disponibles y ocupadas
• Desactivar residentes cuando corresponda

**🎯 Pasos para crear/registrar un nuevo residente:**
1. Desde el panel: **Gestión de Comunidad → Residentes → Crear Nuevo**
2. Completa el formulario:
   - Información personal:
     * Nombre completo
     * Documento de identidad
     * Teléfono de contacto
     * Email (si está disponible)
   - Información de la comunidad:
     * Selecciona la comunidad
     * Tipo de residente (Propietario, Inquilino, Residente)
   - Asignación de unidad:
     * Selecciona la unidad a asignar
     * O crea la unidad primero si no existe
3. Configura permisos y roles:
   - Asigna los roles apropiados según el tipo de residente
   - Define permisos de acceso al sistema
4. Revisa la información y guarda
5. El residente recibirá credenciales de acceso (si aplica)

**🎯 Para gestionar residentes existentes:**
1. **Ver residentes:** Escribe "residentes" o "muéstrame los residentes"
2. **Editar información:** Selecciona el residente → Editar
3. **Cambiar unidad:** Puedes reasignar unidades a residentes
4. **Gestionar desde interfaz:** Panel → Gestión de Comunidad → Residentes

**💡 Consejos:**
• Verifica que la unidad esté disponible antes de asignar
• Mantén la información de contacto actualizada
• Revisa periódicamente las asignaciones de unidades

**💡 Tip:** Escribe "muéstrame los residentes" para ver datos reales de la base de datos.`,
          };
        }
        break;

      case 'organizaciones':
        if (isSuperAdmin) {
          return {
            answer: `🏢 **Cómo gestionar Organizaciones - Super Administrador**

Como Super Administrador, puedes crear, registrar y gestionar todas las organizaciones del sistema.

**📋 Funcionalidades disponibles:**
• Crear/Registrar nuevas organizaciones en el sistema
• Ver todas las organizaciones del sistema
• Editar información de organizaciones existentes
• Gestionar planes y suscripciones de organizaciones
• Activar/desactivar organizaciones
• Gestionar usuarios administradores de organizaciones

**🎯 Pasos para crear/registrar una nueva organización:**
1. Desde el panel: **Super Administración → Organizaciones → Crear Nueva**
2. Completa el formulario:
   - **Información básica:**
     * Nombre de la organización
     * RUT o identificación fiscal
     * Dirección
     * Teléfono de contacto
     * Email de contacto
   - **Configuración del sistema:**
     * Plan de suscripción (Básico, Premium, Enterprise)
     * Límites de usuarios/comunidades según el plan
     * Configuraciones de facturación
   - **Administrador inicial:**
     * Crea o asigna un usuario administrador
     * Define permisos del administrador
3. Revisa la información y activa la organización
4. Guarda y la organización estará lista para usar

**🎯 Para gestionar organizaciones existentes:**
1. **Ver organizaciones:** Escribe "organizaciones" o "muéstrame las organizaciones"
2. **Editar información:** Selecciona la organización → Editar
3. **Gestionar planes:** Cambia el plan de suscripción según necesidades
4. **Usuarios:** Gestiona administradores y usuarios de la organización

**💡 Consejos:**
• Verifica que la información fiscal sea correcta para facturación
• Asigna el plan adecuado según las necesidades de la organización
• Revisa periódicamente el uso vs límites del plan

**💡 Tip:** Escribe "muéstrame las organizaciones" para ver datos específicos.`,
          };
        }
        break;

      case 'metricas':
        if (isSuperAdmin) {
          return {
            answer: `📊 **Cómo ver Métricas del Sistema - Super Administrador**

Puedes ver métricas y estadísticas globales del sistema.

**📋 Funcionalidades disponibles:**
• Ver métricas del sistema (usuarios, comunidades, unidades, etc.)
• Ver estadísticas de uso
• Ver reportes globales
• Consultar salud del sistema

**🎯 Pasos para usar:**
1. **Ver métricas:** Escribe "métricas del sistema" o "estadísticas"
2. **Desde la interfaz:** Panel de Super Admin → Métricas del Sistema
3. Puedes ver diferentes tipos de reportes y análisis

**💡 Tip:** Escribe "muéstrame las métricas" para ver datos específicos del sistema.`,
          };
        }
        break;
    }

    // Si no hay explicación específica, retornar null para que continúe con el flujo normal
    return null;
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

  private async queryOpenAI(question: string): Promise<ChatbotResponseDto> {
    try {
      // Verificar cache primero
      const cachedResponse = this.getCachedResponse(question);
      if (cachedResponse) {
        return { answer: cachedResponse };
      }

      // Rate limiting deshabilitado para testing
      // if (this.isRateLimited()) {
      //   this.logger.warn('Rate limit exceeded, using fallback response');
      //   return { answer: this.getFallbackResponse(question) };
      // }

      const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

      if (!openaiKey) {
        this.logger.error('OPENAI_API_KEY not configured');
        return { answer: 'El servicio de IA no está configurado correctamente.' };
      }

      // Aplicar delay inteligente para evitar rate limiting
      await this.ensureRequestDelay();

      // Obtener información contextual del sistema
      const contextInfo = await this.getSystemContext();

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Eres ComunIAssistant, un asistente virtual especializado ÚNICAMENTE en Comuniapp (plataforma de gestión comunitaria).

## IDENTIDAD Y PERSONALIDAD
- Asistente amigable, profesional y experto en la plataforma Comuniapp
- Respondes preferentemente en español latinoamericano
- Usas emojis estratégicamente para mejorar la comunicación
- Eres útil, informativo y conversacional

## ⚠️ ALCANCE LIMITADO - SOLO COMUNIAPP
**IMPORTANTE:** Solo debes responder preguntas relacionadas con Comuniapp y gestión comunitaria.

**TEMAS PERMITIDOS:**
✅ Gestión de comunidades
✅ Espacios comunes y reservas
✅ Gastos comunes y pagos
✅ Visitantes
✅ Encomiendas
✅ Avisos comunitarios
✅ Residentes y unidades
✅ Incidencias y reportes
✅ Administración de comunidades
✅ Funcionalidades de Comuniapp
✅ Cómo usar Comuniapp
✅ Consultas sobre el sistema Comuniapp

**TEMAS PROHIBIDOS (NO RESPONDAS SOBRE):**
❌ Deportes
❌ Entretenimiento
❌ Noticias generales
❌ Historia, cultura, arte
❌ Programación o tecnología general
❌ Salud y medicina
❌ Cualquier tema ajeno a Comuniapp

**Si el usuario pregunta sobre un tema fuera de Comuniapp:**
- Indica cortésmente que solo puedes ayudar con temas relacionados con Comuniapp
- Ofrece información sobre las funcionalidades disponibles de Comuniapp
- Sugiere cómo puede usar Comuniapp para sus necesidades

## INFORMACIÓN DEL SISTEMA
${contextInfo}

**Funcionalidades principales de Comuniapp:**
• 🏢 Espacios comunes y reservas
• 💰 Gastos comunes y pagos
• 👥 Gestión de visitantes
• 📦 Encomiendas
• 📢 Avisos comunitarios
• 🏠 Unidades y residentes

## MANEJO DE SALUDOS Y DESPEDIDAS
- **Saludos:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde de manera amigable y natural, pero SIEMPRE en el contexto de Comuniapp
  * Ejemplo: "¡Hola! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. ¿En qué puedo ayudarte hoy con la gestión comunitaria?"
  * Menciona brevemente que puedes ayudar con funcionalidades de Comuniapp
  * Para usuarios no autenticados, mantén un saludo genérico pero siempre relacionado con Comuniapp
  
- **Despedidas:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde de manera cálida pero en el contexto de Comuniapp
  * Ejemplo: "¡De nada! Fue un placer ayudarte con Comuniapp. Estoy aquí siempre que necesites gestionar tu comunidad. ¡Que tengas un excelente día! 😊"
  * Reafirma tu disponibilidad para ayudar con Comuniapp
  * Mantén un tono profesional pero amigable

- **Siempre contextualiza:** Incluso los saludos y despedidas deben mencionar Comuniapp o la gestión comunitaria para mantener el foco
- **IMPORTANTE:** Para usuarios autenticados, los saludos y despedidas se adaptan automáticamente según su rol (ver instrucciones específicas en el contexto del usuario)

## INSTRUCCIONES DE RESPUESTA
- **SOLO responde preguntas sobre Comuniapp y gestión comunitaria**
- **NUNCA respondas sobre temas externos** (deportes, entretenimiento, noticias, etc.)
- Si el usuario pregunta sobre un tema ajeno a Comuniapp, indica cortésmente que solo puedes ayudar con Comuniapp
- Sé conversacional, natural y útil
- Proporciona información precisa y completa sobre Comuniapp
- Adapta tu tono según la pregunta
- Usa emojis cuando sea apropiado
- Estructura la información de forma clara

## OBJETIVO PRINCIPAL
Ser un asistente especializado ÚNICAMENTE en Comuniapp que proporciona respuestas claras, precisas y amigables sobre la plataforma y gestión comunitaria.`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      };

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return await this.handleOpenAIError(response, question);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

      // Guardar en cache
      this.setCachedResponse(question, answer);

      return { answer };
    } catch (error) {
      this.logger.error('Error querying OpenAI:', error);
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

  private async getResidentsInfo(): Promise<ChatbotResponseDto> {
    try {
      const residents = await this.prisma.user.findMany({
        where: {
          isActive: true,
          roles: {
            some: {
              role: {
                name: 'RESIDENT',
              },
            },
          },
        },
        include: {
          userUnits: {
            include: {
              unit: {
                include: {
                  community: true,
                },
              },
            },
          },
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (residents.length === 0) {
        return {
          answer:
            '👥 **Registro de Residentes**\n\n' +
            '📭 No hay residentes registrados actualmente.\n\n' +
            '💡 *Los residentes se registran a través del sistema de administración.*',
        };
      }

      let response = '👥 RESIDENTES REGISTRADOS\n\n';
      response += '─'.repeat(60) + '\n\n';

      for (let i = 0; i < residents.length; i++) {
        const resident = residents[i];
        const registrationDate = resident.createdAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        response += `👤 ${resident.name}\n\n`;
        response += `📧 Email: ${resident.email}\n`;
        response += `📅 Registrado: ${registrationDate}\n`;

        if (resident.phone) {
          response += `📞 Teléfono: ${resident.phone}\n`;
        }

        if (resident.userUnits.length > 0) {
          response += `🏠 Unidades: `;
          const units = resident.userUnits.map(
            (uu) => `${uu.unit.number} (${uu.unit.community.name})`,
          );
          response += units.join(', ') + '\n';
        }

        const roles = resident.roles.map((ur) => ur.role.name).join(', ');
        response += `🔑 Roles: ${roles}\n\n`;

        if (i < residents.length - 1) {
          response += '─'.repeat(40) + '\n\n';
        }
      }

      response += '\n💡 Información adicional:\n\n';
      response += '• Los residentes tienen acceso a sus unidades asignadas\n';
      response += '• Pueden gestionar visitantes y encomiendas\n';
      response += '• Contacta a la administración para más detalles';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting residents info:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de residentes.\n' +
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

      const whereClause: any = { isActive: true };
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

      const whereClause: any = { isActive: true };
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

      const whereClause: any = {
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

  // Método específico para consultas sobre deudas pendientes
  private async getDebtInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isResident = userRoles.includes('RESIDENT');

      if (!isResident) {
        return {
          answer: '❌ Esta información está disponible solo para residentes.',
        };
      }

      const userId = userInfo?.id;
      if (!userId) {
        return {
          answer: '❌ No se encontró información del usuario. Contacta a la administración.',
        };
      }

      // Obtener las unidades del usuario (misma lógica que getMyExpenses)
      const userUnits = await this.prisma.userUnit.findMany({
        where: { userId, status: 'CONFIRMED' },
        select: { unitId: true },
      });

      const unitIds = userUnits.map((uu) => uu.unitId);

      if (unitIds.length === 0) {
        return {
          answer: '❌ No tienes unidades asignadas. Contacta a la administración.',
        };
      }

      // Obtener gastos específicos del usuario (misma lógica que getMyExpenses)
      const expenses = await this.prisma.expense.findMany({
        where: {
          unitId: { in: unitIds },
          status: 'PENDING', // Solo gastos pendientes
        },
        include: {
          unit: {
            include: {
              community: true,
            },
          },
          payments: {
            where: { userId },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });

      if (expenses.length === 0) {
        return {
          answer: `💰 Estado de Pagos\n\n✅ No tienes gastos pendientes.\n\n💡 *Todos tus pagos están al día.*`,
        };
      }

      let response = `💰 Estado de Pagos\n\n`;
      response += '─'.repeat(50) + '\n\n';

      let totalPending = 0;

      for (const expense of expenses) {
        const dueDate = expense.dueDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        const amount = Number(expense.amount);
        totalPending += amount;

        response += `📅 ${expense.concept}\n`;
        response += `💰 Monto: $${amount.toFixed(2)}\n`;
        response += `📆 Vencimiento: ${dueDate}\n`;
        response += `📊 Estado: ⏳ Pendiente\n`;

        if (expense.description) {
          response += `📝 Detalle: ${expense.description}\n`;
        }

        response += `🏢 Comunidad: ${expense.unit.community.name}\n`;
        response += `🏠 Unidad: ${expense.unit.number}\n\n`;

        response += '─'.repeat(30) + '\n\n';
      }

      response += `💵 Total pendiente: $${totalPending.toFixed(2)}\n\n`;
      response += `💡 *Tienes ${expenses.length} gasto${expenses.length > 1 ? 's' : ''} pendiente${expenses.length > 1 ? 's' : ''}.*\n`;
      response += `📞 *Para más detalles, contacta a la administración.*`;

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de deudas para usuario:', error);
      return {
        answer: '❌ Error al obtener información de deudas. Por favor, intenta más tarde.',
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

      const whereClause: any = {};
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

      const whereClause: any = {};
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

  private async getResidentsInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      const whereClause: any = {
        isActive: true,
        roles: {
          some: {
            role: {
              name: 'RESIDENT',
            },
          },
        },
      };
      let communityContext = '';

      if (isSuperAdmin) {
        // Super Admin ve todos los residentes
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        // Community Admin ve residentes de sus comunidades
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.userUnits = {
            some: {
              unit: {
                community: {
                  isActive: true,
                  id: { in: communityIds },
                },
              },
            },
          };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge) {
        // Concierge ve residentes de su comunidad
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.userUnits = {
            some: {
              unit: {
                community: {
                  isActive: true,
                  id: communityId,
                },
              },
            },
          };
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      } else if (isResident) {
        // Resident ve solo información básica de otros residentes (sin datos sensibles)
        communityContext = `su comunidad`;
      }

      const residents = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          userUnits: {
            include: {
              unit: {
                include: {
                  community: true,
                },
              },
            },
          },
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (residents.length === 0) {
        return {
          answer:
            `👥 **Residentes - ${this.getUserRoleDisplayName(userRoles)}**\n\n` +
            `📭 No hay residentes registrados en ${communityContext}.\n\n` +
            `💡 *Los residentes se registran a través del sistema de administración.*`,
        };
      }

      let response = '👥 RESIDENTES REGISTRADOS\n\n';
      response += `👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 Contexto: ${communityContext}\n\n`;
      response += '─'.repeat(60) + '\n\n';

      for (let i = 0; i < residents.length; i++) {
        const resident = residents[i];
        const registrationDate = resident.createdAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        response += `👤 ${resident.name}\n\n`;

        // Mostrar email solo si es admin o conserje
        if (isSuperAdmin || isCommunityAdmin || isConcierge) {
          response += `📧 Email: ${resident.email}\n`;
        }

        response += `📅 Registrado: ${registrationDate}\n`;

        // Mostrar teléfono solo si es admin o conserje
        if ((isSuperAdmin || isCommunityAdmin || isConcierge) && resident.phone) {
          response += `📞 Teléfono: ${resident.phone}\n`;
        }

        if (resident.userUnits.length > 0) {
          response += `🏠 Unidades: `;
          const units = resident.userUnits.map(
            (uu) => `${uu.unit.number} (${uu.unit.community.name})`,
          );
          response += units.join(', ') + '\n';
        }

        // Mostrar roles solo si es admin
        if (isSuperAdmin || isCommunityAdmin) {
          const roles = resident.roles.map((ur) => ur.role.name).join(', ');
          response += `🔑 Roles: ${roles}\n`;
        }

        response += '\n';

        if (i < residents.length - 1) {
          response += '─'.repeat(40) + '\n\n';
        }
      }

      response += '\n💡 Información adicional:\n\n';
      if (isConcierge) {
        response += '• Como conserje, puedes ver información de contacto de los residentes\n';
        response += '• Mantén actualizada la información de contacto\n';
        response += '• Contacta a la administración para cambios en roles\n';
      } else if (isResident) {
        response += '• Los residentes tienen acceso a sus unidades asignadas\n';
        response += '• Pueden gestionar visitantes y encomiendas\n';
        response += '• Contacta a la administración para más detalles\n';
      } else if (isCommunityAdmin) {
        response += '• Puedes gestionar residentes desde el panel de administración\n';
        response += '• Asigna y modifica roles según sea necesario\n';
        response += '• Mantén actualizada la información de contacto\n';
      } else {
        response += '• Los residentes tienen acceso a sus unidades asignadas\n';
        response += '• Pueden gestionar visitantes y encomiendas\n';
        response += '• Contacta a la administración para más detalles\n';
      }

      return { answer: response };
    } catch (error) {
      this.logger.error('Error getting residents info for user:', error);
      return {
        answer:
          '❌ **Error del Sistema**\n\n' +
          'Ocurrió un error al obtener la información de residentes.\n' +
          'Por favor, intenta nuevamente o contacta a la administración.',
      };
    }
  }

  private async queryOpenAIWithUserContext(
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

      // Rate limiting deshabilitado para testing
      // if (this.isRateLimited()) {
      //   this.logger.warn('Rate limit exceeded, using fallback response for authenticated user');
      //   return { answer: this.getFallbackResponse(question) };
      // }

      const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

      if (!openaiKey) {
        this.logger.error('OPENAI_API_KEY not configured');
        return { answer: 'El servicio de IA no está configurado correctamente.' };
      }

      // Aplicar delay inteligente para evitar rate limiting
      await this.ensureRequestDelay();

      // Obtener información contextual del sistema y usuario
      const systemContext = await this.getSystemContext();
      const userContext = this.getUserContextForAI(userInfo, userRoles);

      // ⚠️ IMPORTANTE: Obtener datos relevantes de la BD antes de enviar a la IA
      // Esto asegura que la IA use datos reales en lugar de inventar información
      const databaseData = await this.getRelevantDatabaseData(question, userInfo, userRoles);

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Eres ComunIAssistant, un asistente virtual especializado ÚNICAMENTE en Comuniapp (plataforma de gestión comunitaria).

## IDENTIDAD Y PERSONALIDAD
- Asistente amigable, profesional y experto en la plataforma Comuniapp
- Respondes preferentemente en español latinoamericano
- Usas emojis estratégicamente para mejorar la comunicación
- Eres útil, informativo y conversacional
- Te adaptas al usuario para proporcionar respuestas personalizadas según su rol

## ⚠️ ALCANCE LIMITADO - SOLO COMUNIAPP
**IMPORTANTE:** Solo debes responder preguntas relacionadas con Comuniapp y gestión comunitaria. 

**TEMAS PERMITIDOS:**
✅ Gestión de comunidades
✅ Espacios comunes y reservas
✅ Gastos comunes y pagos
✅ Visitantes
✅ Encomiendas
✅ Avisos comunitarios
✅ Residentes y unidades
✅ Incidencias y reportes
✅ Administración de comunidades
✅ Funcionalidades de Comuniapp
✅ Cómo usar Comuniapp
✅ Consultas sobre el sistema Comuniapp

**TEMAS PROHIBIDOS (NO RESPONDAS SOBRE):**
❌ Deportes
❌ Entretenimiento
❌ Noticias generales
❌ Historia, cultura, arte
❌ Programación o tecnología general
❌ Salud y medicina
❌ Cualquier tema ajeno a Comuniapp

**Si el usuario pregunta sobre un tema fuera de Comuniapp:**
- Indica cortésmente que solo puedes ayudar con temas relacionados con Comuniapp
- Ofrece redirigir la conversación hacia funcionalidades de Comuniapp
- Sugiere funcionalidades disponibles según su rol

## ⚠️ REGLA CRÍTICA: USO DE DATOS DE BASE DE DATOS
${
  databaseData
    ? `📊 **DATOS REALES DE LA BASE DE DATOS DISPONIBLES:**
${databaseData}

**INSTRUCCIONES CRÍTICAS:**
- SIEMPRE usa estos datos cuando respondas preguntas sobre Comuniapp
- NUNCA inventes o hagas conjeturas sobre datos del sistema
- Si hay datos disponibles aquí, ÚSALOS en tu respuesta
- Si no hay datos disponibles, indica claramente que no hay información disponible
- NUNCA digas "no hay información" si hay datos disponibles aquí arriba
- Si el usuario pregunta sobre algo que está en los datos, usa esos datos específicos`
    : `**No hay datos específicos de base de datos para esta consulta.**`
}

## INFORMACIÓN DEL SISTEMA (OPCIONAL)
Si el usuario pregunta específicamente sobre Comuniapp:
${systemContext}

## INFORMACIÓN DEL USUARIO ACTUAL
${userContext}

## INSTRUCCIONES DE RESPUESTA CRÍTICAS
${this.getCriticalResponseInstructions(userRoles)}

${this.getGreetingAndFarewellInstructions(userInfo, userRoles)}

## INSTRUCCIONES GENERALES DE RESPUESTA
- **SOLO responde preguntas sobre Comuniapp y gestión comunitaria**
- **NUNCA respondas sobre temas externos** (deportes, entretenimiento, noticias, etc.)
- Si el usuario pregunta sobre un tema ajeno a Comuniapp, indica cortésmente que solo puedes ayudar con Comuniapp
- Saluda al usuario por su nombre si está disponible
- Sé conversacional, natural y útil
- Proporciona información precisa y completa sobre Comuniapp
- Adapta tu tono según la pregunta y el usuario
- Usa emojis cuando sea apropiado
- Estructura la información de forma clara
- Personaliza las respuestas según el rol del usuario cuando sea relevante
- SIEMPRE respeta los límites de acceso según el rol del usuario
- Si el usuario pregunta sobre algo que no puede hacer, explícale cortésmente sus limitaciones
- **CRÍTICO:** Cuando hay datos de BD disponibles arriba, ÚSALOS. Nunca inventes información del sistema.

## OBJETIVO PRINCIPAL
Ser un asistente especializado ÚNICAMENTE en Comuniapp que proporciona respuestas claras, precisas y amigables sobre la plataforma y gestión comunitaria, respetando siempre los permisos y funcionalidades disponibles según el rol del usuario, y usando SIEMPRE datos reales de la base de datos cuando estén disponibles.`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      };

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return await this.handleOpenAIError(response, question);
      }

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

      // Guardar en cache con clave única
      this.setCachedResponse(cacheKey, answer);

      return { answer };
    } catch (error) {
      this.logger.error('Error querying OpenAI with user context:', error);
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

    // Agregar funcionalidades detalladas según el rol
    context += `\n## FUNCIONALIDADES DISPONIBLES PARA ESTE USUARIO:\n\n`;
    context += this.getRoleCapabilities(userRoles);

    context += `\n## REGLAS DE RESPUESTA ESPECÍFICAS:\n\n`;
    context += this.getRoleResponseRules(userRoles);

    return context;
  }

  private getRoleCapabilities(userRoles: string[]): string {
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
    const isConcierge = userRoles.includes('CONCIERGE');
    const isResident =
      userRoles.includes('RESIDENT') || userRoles.includes('OWNER') || userRoles.includes('TENANT');

    if (isSuperAdmin) {
      return `🔧 **SUPER ADMINISTRADOR - Acceso Total al Sistema**

**Gestión de Organizaciones:**
• Crear, ver, editar y eliminar organizaciones
• Ver todas las organizaciones del sistema
• Gestionar planes y suscripciones de organizaciones

**Gestión de Usuarios:**
• Crear, ver, editar y eliminar cualquier usuario
• Asignar y revocar roles a cualquier usuario
• Ver métricas del sistema y estadísticas globales
• Acceso a todos los datos de todas las comunidades

**Gestión de Comunidades:**
• Ver, crear, editar y eliminar cualquier comunidad
• Gestionar espacios comunes de todas las comunidades
• Ver y gestionar gastos comunes de todas las comunidades
• Ver reportes y métricas de todas las comunidades

**Gestión de Funcionalidades:**
• Gestionar visitantes de todas las comunidades
• Gestionar encomiendas de todas las comunidades
• Gestionar reservas de espacios comunes de todas las comunidades
• Ver y gestionar avisos de todas las comunidades
• Ver y gestionar ingresos comunitarios
• Ver y gestionar categorías de gastos de todas las comunidades
• Ver métricas del sistema (salud, rendimiento, uso)

**Consultas Disponibles:**
• "¿Cuántos usuarios hay en el sistema?" - Ver estadísticas de usuarios
• "¿Qué organizaciones existen?" - Ver todas las organizaciones
• "¿Cuáles son las métricas del sistema?" - Ver salud y rendimiento
• "Muestra las comunidades con más deudas" - Análisis financiero global
• Cualquier consulta sobre cualquier aspecto del sistema`;
    } else if (isCommunityAdmin) {
      return `👨‍💼 **ADMINISTRADOR DE COMUNIDAD - Gestión Completa de Comunidades Asignadas**

**Gestión de Comunidades:**
• Ver y editar información de comunidades administradas (nombre, dirección, tipo, teléfono, email)
• Gestionar espacios comunes (crear, editar, activar/desactivar, horarios)
• Ver reportes y estadísticas de sus comunidades

**Gestión de Usuarios de la Comunidad:**
• Ver todos los residentes, propietarios e inquilinos de sus comunidades
• Gestionar unidades de sus comunidades (crear, editar, asignar a usuarios)
• Ver información de usuarios vinculados a sus comunidades
• Gestionar roles de usuarios dentro de sus comunidades (excepto SUPER_ADMIN)

**Gestión Financiera:**
• Crear y gestionar gastos comunes de sus comunidades
• Ver y gestionar pagos de gastos comunes
• Crear y gestionar categorías de gastos e ingresos
• Ver reportes financieros de sus comunidades
• Gestionar ingresos comunitarios
• Ver deudas y pagos pendientes de todas las unidades

**Gestión de Contenido:**
• Crear, editar y eliminar avisos comunitarios
• Ver todos los avisos de sus comunidades

**Gestión Operativa:**
• Ver todos los visitantes de sus comunidades
• Ver todas las encomiendas de sus comunidades
• Ver todas las reservas de espacios comunes de sus comunidades
• Ver incidencias reportadas por residentes de sus comunidades

**Consultas Disponibles:**
• "¿Cuáles son los gastos comunes pendientes?" - Ver deudas
• "¿Cuántos residentes tiene mi comunidad?" - Ver usuarios
• "Muestra las unidades disponibles" - Ver unidades de la comunidad
• "¿Cuáles son los ingresos de este mes?" - Ver ingresos comunitarios
• "¿Qué espacios comunes hay?" - Ver y gestionar espacios
• "Muestra los avisos más recientes" - Ver comunicaciones`;
    } else if (isConcierge) {
      return `🏢 **CONSERJE - Gestión Operativa de la Comunidad**

**Gestión de Visitantes:**
• Ver todos los visitantes registrados de su comunidad
• Actualizar estado de visitantes (REGISTERED → ENTERED → EXITED)
• Ver visitantes pendientes y programados
• Gestionar el registro de llegada y salida de visitantes

**Gestión de Encomiendas:**
• Ver todas las encomiendas recibidas en su comunidad
• Actualizar estado de encomiendas (RECEIVED → RETRIEVED → EXPIRED)
• Ver encomiendas pendientes de retiro
• Gestionar recepción y entrega de paquetes

**Gestión de Reservas:**
• Ver todas las reservas de espacios comunes de su comunidad
• Ver horarios y disponibilidad de espacios comunes
• Ver reservas confirmadas, pendientes y canceladas
• Consultar calendario de reservas

**Gestión de Avisos:**
• Ver todos los avisos comunitarios de su comunidad
• Ver avisos urgentes y comunicados importantes

**Información de la Comunidad:**
• Ver información básica de su comunidad
• Ver espacios comunes disponibles y sus horarios
• Ver estadísticas básicas de visitantes y encomiendas

**Consultas Disponibles:**
• "¿Qué visitantes están registrados hoy?" - Ver visitantes del día
• "¿Hay encomiendas pendientes?" - Ver paquetes sin retirar
• "¿Qué reservas hay para esta semana?" - Ver calendario de reservas
• "¿Cuál es el estado de la encomienda del apartamento 101?" - Consultar paquete específico
• "Muestra los visitantes esperados mañana" - Ver programados
• "¿Qué espacios comunes están reservados?" - Ver reservas activas`;
    } else if (isResident) {
      return `🏠 **RESIDENTE/PROPIETARIO/INQUILINO - Acceso a Mis Unidades**

**Gestión de Mis Unidades:**
• Ver información de mis unidades asignadas
• Ver detalles de mi comunidad (nombre, dirección, contacto)

**Gestión de Mis Gastos:**
• Ver mis gastos comunes y cuotas pendientes
• Ver historial de mis pagos realizados
• Ver deudas y montos adeudados
• Ver estados de cuenta de mis unidades

**Gestión de Mis Visitantes:**
• Registrar visitantes para mis unidades
• Ver mis visitantes registrados y su estado
• Ver historial de visitantes anteriores
• Gestionar información de visitantes (nombre, teléfono, propósito)

**Gestión de Mis Encomiendas:**
• Ver encomiendas recibidas en mis unidades
• Ver estado de paquetes (recibido, retirado)
• Ver fecha de recepción y retiro de paquetes

**Gestión de Mis Reservas:**
• Ver espacios comunes disponibles de mi comunidad
• Crear reservas de espacios comunes
• Ver mis reservas activas y pasadas
• Ver estado de mis reservas (pendiente, confirmada, cancelada)

**Gestión de Incidencias:**
• Crear reportes de incidencias (problemas, quejas, solicitudes)
• Ver mis incidencias reportadas y su estado
• Ver historial de incidencias resueltas

**Información Comunitaria:**
• Ver avisos comunitarios de mi comunidad
• Ver espacios comunes disponibles y sus horarios
• Ver información general de la comunidad

**Consultas Disponibles:**
• "¿Cuánto debo en gastos comunes?" - Ver deudas pendientes
• "¿Cuándo fue mi último pago?" - Ver historial de pagos
• "¿Tengo alguna encomienda?" - Ver paquetes recibidos
• "¿Puedo reservar el salón para mañana?" - Consultar disponibilidad
• "¿Qué visitantes tengo registrados?" - Ver mis visitantes
• "Muestra los avisos recientes" - Ver comunicaciones
• "Quiero reportar un problema" - Guía para crear incidencia
• "¿Cuáles son los horarios del gimnasio?" - Ver horarios de espacios`;
    } else {
      return `👤 **USUARIO - Acceso Básico**
• Información general del sistema
• Consultas sobre funcionalidades disponibles`;
    }
  }

  private getRoleResponseRules(userRoles: string[]): string {
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
    const isConcierge = userRoles.includes('CONCIERGE');
    const isResident =
      userRoles.includes('RESIDENT') || userRoles.includes('OWNER') || userRoles.includes('TENANT');

    let rules = '';

    if (isSuperAdmin) {
      rules += `• **IMPORTANTE:** Puedes responder sobre CUALQUIER aspecto del sistema
• Proporciona información detallada de cualquier comunidad, organización o usuario cuando se solicite
• Puedes ayudar con análisis de datos, métricas y reportes del sistema completo
• Guía sobre gestión de usuarios, roles y permisos
• Responde sobre configuración del sistema y mejores prácticas administrativas
• Cuando se pregunten sobre datos específicos, ofrece detalles completos
• Proporciona información sobre todas las funcionalidades administrativas disponibles\n\n`;
    } else if (isCommunityAdmin) {
      rules += `• **IMPORTANTE:** Solo puedes proporcionar información de las comunidades que administras
• NUNCA proporciones información de comunidades que no administras
• Proporciona detalles financieros de tus comunidades (gastos, ingresos, deudas)
• Puedes ayudar con gestión de usuarios dentro de tus comunidades
• Guía sobre cómo crear avisos, gestionar espacios y administrar la comunidad
• Cuando se pregunten sobre datos específicos de tus comunidades, proporciona información detallada
• Responde sobre funcionalidades de administración de comunidad disponibles
• Puedes ayudar con análisis de datos de tus comunidades\n\n`;
    } else if (isConcierge) {
      rules += `• **IMPORTANTE:** Solo puedes proporcionar información de tu comunidad asignada
• Proporciona información operativa sobre visitantes, encomiendas y reservas
• Puedes ayudar con el estado actual de visitantes y paquetes
• Guía sobre cómo gestionar el registro de visitantes y encomiendas
• Proporciona información sobre horarios y disponibilidad de espacios comunes
• NO proporcionas información financiera detallada ni de gastos comunes (solo información operativa)
• Responde sobre funcionalidades operativas del conserje
• Cuando se pregunten sobre visitantes o paquetes específicos, proporciona detalles si están en tu comunidad\n\n`;
    } else if (isResident) {
      rules += `• **IMPORTANTE:** Solo puedes proporcionar información de LAS UNIDADES DEL USUARIO
• Proporciona información sobre gastos comunes DE SUS UNIDADES únicamente
• Puedes ayudar con registro de visitantes PARA SUS UNIDADES
• Proporciona información sobre encomiendas DE SUS UNIDADES
• Guía sobre cómo crear reservas de espacios comunes
• Puedes ayudar con reporte de incidencias
• Proporciona información de avisos de SU COMUNIDAD
• NO proporciones información de otras unidades o residentes
• Responde sobre funcionalidades disponibles para residentes
• Cuando se pregunten sobre datos financieros, solo proporciona información de SUS unidades
• Ayuda con consultas sobre cómo usar las funcionalidades disponibles\n\n`;
    } else {
      rules += `• Proporciona información general sobre el sistema
• Guía sobre cómo registrarse o usar el sistema
• Responde preguntas generales sobre Comuniapp\n\n`;
    }

    rules += `• **REGLA GENERAL:** Siempre responde de manera útil y amigable
• Si el usuario pregunta sobre algo que NO puede hacer según su rol, explícale cortésmente sus limitaciones
• Si el usuario pregunta sobre funcionalidades disponibles, listalas según su rol
• Proporciona ejemplos prácticos cuando sea apropiado
• Usa emojis para hacer las respuestas más amigables
• Si no estás seguro de los permisos del usuario, sé conservador y pide que verifique con su administrador`;

    return rules;
  }

  private getGreetingAndFarewellInstructions(userInfo: any, userRoles: string[]): string {
    // Manejar casos donde userRoles puede estar vacío o undefined
    const roles = userRoles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isCommunityAdmin = roles.includes('COMMUNITY_ADMIN');
    const isConcierge = roles.includes('CONCIERGE');
    const isOwner = roles.includes('OWNER');
    const isTenant = roles.includes('TENANT');
    const isResident = roles.includes('RESIDENT');
    const userName = userInfo?.name || 'Usuario';
    const roleDisplayName = roles.length > 0 ? this.getUserRoleDisplayName(roles) : 'Usuario';

    let instructions = `## MANEJO DE SALUDOS Y DESPEDIDAS - CONTEXTUALIZADO POR ROL\n\n`;

    if (isSuperAdmin) {
      instructions += `**SALUDOS:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde SIEMPRE adaptándote a su rol de Super Administrador:
  * Ejemplo: "¡Hola ${userName}! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. Como Super Administrador, puedo ayudarte con cualquier aspecto del sistema: gestión de organizaciones, comunidades, usuarios, métricas del sistema y más. ¿En qué puedo asistirte hoy?"
  * Menciona sus capacidades de administración total del sistema
  * Puedes ofrecer ayuda con análisis globales y gestión completa del sistema
  
**DESPEDIDAS:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde contextualizado para Super Administrador:
  * Ejemplo: "¡De nada ${userName}! Fue un placer ayudarte con Comuniapp. Como Super Administrador, recuerda que tengo acceso completo al sistema para asistirte con cualquier consulta. Estoy aquí siempre que necesites gestionar Comuniapp. ¡Que tengas un excelente día! 😊"
  * Reafirma su rol administrativo y la disponibilidad para gestión completa del sistema\n\n`;
    } else if (isCommunityAdmin) {
      instructions += `**SALUDOS:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde SIEMPRE adaptándote a su rol de Administrador de Comunidad:
  * Ejemplo: "¡Hola ${userName}! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. Como Administrador de Comunidad, puedo ayudarte con la gestión completa de tus comunidades: espacios comunes, gastos, residentes, avisos y más. ¿En qué puedo asistirte hoy?"
  * Menciona sus capacidades de administración de comunidades
  * Puedes ofrecer ayuda con reportes, gastos comunes, gestión de unidades y residentes
  
**DESPEDIDAS:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde contextualizado para Administrador de Comunidad:
  * Ejemplo: "¡De nada ${userName}! Fue un placer ayudarte con la administración de tus comunidades en Comuniapp. Estoy aquí siempre que necesites gestionar espacios, gastos, residentes o cualquier aspecto de tus comunidades. ¡Que tengas un excelente día! 😊"
  * Reafirma su rol de administración comunitaria y la disponibilidad para gestionar sus comunidades\n\n`;
    } else if (isConcierge) {
      instructions += `**SALUDOS:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde SIEMPRE adaptándote a su rol de Conserje:
  * Ejemplo: "¡Hola ${userName}! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. Como Conserje, puedo ayudarte con la gestión operativa de tu comunidad: visitantes, encomiendas, reservas de espacios y más. ¿En qué puedo asistirte hoy?"
  * Menciona sus capacidades operativas (visitantes, encomiendas, reservas)
  * Puedes ofrecer ayuda con el día a día de la comunidad
  
**DESPEDIDAS:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde contextualizado para Conserje:
  * Ejemplo: "¡De nada ${userName}! Fue un placer ayudarte con la gestión operativa de tu comunidad en Comuniapp. Estoy aquí siempre que necesites gestionar visitantes, encomiendas o reservas. ¡Que tengas un excelente día! 😊"
  * Reafirma su rol operativo y la disponibilidad para gestionar servicios comunitarios\n\n`;
    } else if (isOwner || isTenant || isResident) {
      const roleType = isOwner ? 'Propietario' : isTenant ? 'Inquilino' : 'Residente';
      instructions += `**SALUDOS:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde SIEMPRE adaptándote a su rol de ${roleType}:
  * Ejemplo: "¡Hola ${userName}! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. Como ${roleType}, puedo ayudarte con tus unidades, gastos comunes, visitantes, encomiendas, reservas de espacios y más. ¿En qué puedo asistirte hoy?"
  * Menciona sus capacidades como residente (sus unidades, gastos, servicios)
  * Puedes ofrecer ayuda con consultas sobre sus unidades y servicios comunitarios
  
**DESPEDIDAS:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde contextualizado para ${roleType}:
  * Ejemplo: "¡De nada ${userName}! Fue un placer ayudarte con Comuniapp. Como ${roleType}, estoy aquí siempre que necesites consultar tus gastos, registrar visitantes, gestionar tus reservas o cualquier tema relacionado con tus unidades. ¡Que tengas un excelente día! 😊"
  * Reafirma su rol de residente y la disponibilidad para gestionar sus unidades y servicios\n\n`;
    } else {
      instructions += `**SALUDOS:** Cuando el usuario saluda (hola, buenos días, hi, etc.), responde SIEMPRE en el contexto de Comuniapp:
  * Ejemplo: "¡Hola ${userName}! 👋 Soy ComunIAssistant, tu asistente virtual de Comuniapp. ¿En qué puedo ayudarte hoy con la gestión comunitaria?"
  * Si conoces el nombre del usuario, salúdalo personalmente
  * Menciona brevemente que puedes ayudar con funcionalidades de Comuniapp
  
**DESPEDIDAS:** Cuando el usuario se despide o agradece (gracias, chao, adiós, etc.), responde contextualizado en Comuniapp:
  * Ejemplo: "¡De nada ${userName}! Fue un placer ayudarte con Comuniapp. Estoy aquí siempre que necesites gestionar tu comunidad. ¡Que tengas un excelente día! 😊"
  * Reafirma tu disponibilidad para ayudar con Comuniapp\n\n`;
    }

    instructions += `**REGLA CRÍTICA:**
- SIEMPRE contextualiza saludos y despedidas según el rol del usuario (${roleDisplayName})
- Menciona funcionalidades específicas disponibles para su rol cuando sea apropiado
- Mantén un tono profesional pero amigable adaptado al contexto del usuario
- Incluso los saludos y despedidas deben mencionar Comuniapp y adaptarse al tipo de usuario`;

    return instructions;
  }

  /**
   * Detecta si la pregunta requiere datos de BD y los obtiene antes de enviar a la IA
   * Esto asegura que la IA use datos reales en lugar de inventar información
   */
  private async getRelevantDatabaseData(
    question: string,
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    const lowerQuestion = question.toLowerCase().trim();

    // Detectar si la pregunta es sobre datos del sistema
    // Incluye palabras clave de los mensajes de acceso directo del frontend
    const requiresSpaces = this.matchesKeywords(lowerQuestion, [
      'espacio',
      'espacios',
      'espacios comunes',
      'salon',
      'salón',
      'gimnasio',
      'gym',
      'piscina',
      'cancha',
      'jardin',
      'jardín',
      'terraza',
      'comun',
      'comunes',
      'disponible',
      'disponibles',
      'reservar',
      'reserva',
      'reservas',
      'horario',
      'horarios',
    ]);

    const requiresAnnouncements = this.matchesKeywords(lowerQuestion, [
      'aviso',
      'avisos',
      'comunicado',
      'comunicados',
      'noticia',
      'noticias',
      'anuncio',
      'anuncios',
      'informacion',
      'información',
      'comunicacion',
      'comunicación',
    ]);

    const requiresExpenses = this.matchesKeywords(lowerQuestion, [
      'gasto',
      'gastos',
      'gastos comunes',
      'mis gastos',
      'cuota',
      'cuotas',
      'pago',
      'pagos',
      'mis pagos',
      'factura',
      'facturas',
      'deuda',
      'deudas',
      'adeudo',
      'adeudos',
      'pendiente',
      'pendientes',
      'cobro',
      'cobros',
      'administracion',
      'administración',
      'cuanto debo',
      'cuánto debo',
      'cuanta plata',
      'cuánta plata',
      'cuanto dinero',
      'cuánto dinero',
      'cuanto tengo que pagar',
      'cuánto tengo que pagar',
      'cuanto debo pagar',
      'cuánto debo pagar',
      'estado de pagos',
    ]);

    const requiresVisitors = this.matchesKeywords(lowerQuestion, [
      'visitante',
      'visitantes',
      'visita',
      'visitas',
      'mis visitantes',
      'invitado',
      'invitados',
      'acompañante',
      'acompanante',
      'registrar visita',
      'registrar visitante',
    ]);

    const requiresParcels = this.matchesKeywords(lowerQuestion, [
      'encomienda',
      'encomiendas',
      'mis encomiendas',
      'paquete',
      'paquetes',
      'correo',
      'delivery',
      'envio',
      'envíos',
      'envios',
      'recepcion',
      'recepción',
    ]);

    const requiresResidents = this.matchesKeywords(lowerQuestion, [
      'residente',
      'residentes',
      'vecino',
      'vecinos',
      'habitante',
      'habitantes',
      'propietario',
      'propietarios',
      'usuarios del sistema',
      'gestion de usuarios',
      'gestión de usuarios',
    ]);

    const requiresReservations = this.matchesKeywords(lowerQuestion, [
      'reserva',
      'reservas',
      'reservado',
      'reservados',
      'calendario',
      'agenda',
      'reservar espacio',
      'reservar espacios',
    ]);

    const requiresIncome = this.matchesKeywords(lowerQuestion, [
      'ingresos',
      'ingreso',
      'rentas',
      'renta',
      'alquileres',
      'alquiler',
      'ventas',
      'venta',
      'finanzas',
    ]);

    const requiresOrganizations = this.matchesKeywords(lowerQuestion, [
      'organizaciones',
      'organizacion',
      'organización',
      'organizacion',
      'gestion de organizaciones',
      'gestión de organizaciones',
      'gestion organizaciones',
      'gestión organizaciones',
    ]);

    const requiresMetrics = this.matchesKeywords(lowerQuestion, [
      'metricas',
      'métricas',
      'metricas del sistema',
      'métricas del sistema',
      'estadisticas',
      'estadísticas',
      'reportes',
      'reporte',
    ]);

    const requiresCommunities = this.matchesKeywords(lowerQuestion, [
      'comunidades',
      'comunidad',
      'gestion de comunidad',
      'gestión de comunidad',
      'gestion comunidad',
      'gestión comunidad',
    ]);

    const requiresIncidents = this.matchesKeywords(lowerQuestion, [
      'reportar problema',
      'reportar problemas',
      'reportar incidencia',
      'reportar incidencias',
      'incidencia',
      'incidencias',
      'problema',
      'problemas',
      'queja',
      'quejas',
    ]);

    // Obtener datos relevantes según lo que se detecta en la pregunta
    let dataParts: string[] = [];

    try {
      if (requiresSpaces) {
        const spacesData = await this.getCommonSpacesDataForContext(userInfo, userRoles);
        if (spacesData) dataParts.push(spacesData);
      }

      if (requiresAnnouncements) {
        const announcementsData = await this.getAnnouncementsDataForContext(userInfo, userRoles);
        if (announcementsData) dataParts.push(announcementsData);
      }

      if (requiresExpenses || requiresVisitors || requiresParcels) {
        // Para deudas/gastos específicos, obtener información relevante
        if (requiresExpenses) {
          const expensesData = await this.getExpensesDataForContext(userInfo, userRoles);
          if (expensesData) dataParts.push(expensesData);
        }

        if (requiresVisitors) {
          const visitorsData = await this.getVisitorsDataForContext(userInfo, userRoles);
          if (visitorsData) dataParts.push(visitorsData);
        }

        if (requiresParcels) {
          const parcelsData = await this.getParcelsDataForContext(userInfo, userRoles);
          if (parcelsData) dataParts.push(parcelsData);
        }
      }

      if (requiresResidents) {
        const residentsData = await this.getResidentsDataForContext(userInfo, userRoles);
        if (residentsData) dataParts.push(residentsData);
      }

      if (requiresReservations) {
        const reservationsData = await this.getReservationsDataForContext(userInfo, userRoles);
        if (reservationsData) dataParts.push(reservationsData);
      }

      if (requiresIncome) {
        const incomeData = await this.getIncomeDataForContext(userInfo, userRoles);
        if (incomeData) dataParts.push(incomeData);
      }

      if (requiresOrganizations || requiresCommunities || requiresMetrics) {
        const adminData = await this.getAdminDataForContext(userInfo, userRoles, {
          organizations: requiresOrganizations,
          communities: requiresCommunities,
          metrics: requiresMetrics,
        });
        if (adminData) dataParts.push(adminData);
      }

      if (requiresIncidents) {
        const incidentsData = await this.getIncidentsDataForContext(userInfo, userRoles);
        if (incidentsData) dataParts.push(incidentsData);
      }
    } catch (error) {
      this.logger.error('Error obteniendo datos de BD para contexto:', error);
      return null;
    }

    return dataParts.length > 0 ? dataParts.join('\n\n') : null;
  }

  /**
   * Métodos auxiliares para obtener datos específicos de BD para el contexto de la IA
   */
  private async getCommonSpacesDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');

      const whereClause: any = { isActive: true };

      if (!isSuperAdmin) {
        if (isCommunityAdmin) {
          const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
          if (communityIds.length > 0) {
            whereClause.community = { id: { in: communityIds } };
          } else {
            return null;
          }
        } else if (isConcierge || isResident) {
          const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
          if (communityId) {
            whereClause.community = { id: communityId };
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      const spaces = await this.prisma.communityCommonSpace.findMany({
        where: whereClause,
        include: {
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
          community: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      });

      if (spaces.length === 0) {
        return '📋 **Espacios Comunes:** No hay espacios comunes registrados.';
      }

      let data = '📋 **ESPACIOS COMUNES DISPONIBLES EN LA BASE DE DATOS:**\n\n';
      spaces.forEach((space) => {
        data += `🏢 **${space.name}** (${space.community.name})\n`;
        data += `   Estado: ${space.isActive ? '✅ Disponible' : '❌ No disponible'}\n`;
        data += `   Cantidad: ${space.quantity}\n`;
        if (space.description) {
          data += `   Descripción: ${space.description}\n`;
        }
        if (space.schedules.length > 0) {
          data += `   Horarios: `;
          const scheduleText = space.schedules
            .map((s) => `${this.getDayName(s.dayOfWeek)} ${s.startTime}-${s.endTime}`)
            .join(', ');
          data += scheduleText + '\n';
        }
        data += '\n';
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo espacios comunes para contexto:', error);
      return null;
    }
  }

  private async getAnnouncementsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');

      const whereClause: any = { isActive: true };

      if (!isSuperAdmin) {
        if (isCommunityAdmin) {
          const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
          if (communityIds.length > 0) {
            whereClause.communityId = { in: communityIds };
          } else {
            return null;
          }
        } else if (isConcierge || isResident) {
          const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
          if (communityId) {
            whereClause.communityId = communityId;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      const announcements = await this.prisma.announcement.findMany({
        where: whereClause,
        include: {
          community: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      });

      if (announcements.length === 0) {
        return '📢 **Avisos:** No hay avisos registrados.';
      }

      let data = '📢 **AVISOS COMUNITARIOS EN LA BASE DE DATOS:**\n\n';
      announcements.forEach((announcement) => {
        const date = announcement.publishedAt.toLocaleDateString('es-ES');
        data += `📌 **${announcement.title}** (${announcement.community.name})\n`;
        data += `   Fecha: ${date}\n`;
        data += `   Tipo: ${this.getAnnouncementTypeName(announcement.type)}\n`;
        data += `   Contenido: ${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}\n\n`;
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo avisos para contexto:', error);
      return null;
    }
  }

  private async getExpensesDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      // Para residentes, obtener solo sus gastos
      if (
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT')
      ) {
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length === 0) return null;

        const expenses = await this.prisma.expense.findMany({
          where: {
            unitId: { in: unitIds },
            status: { not: 'CANCELLED' },
          },
          include: {
            unit: { include: { community: { select: { name: true } } } },
            category: true,
          },
          orderBy: { dueDate: 'desc' },
          take: 10,
        });

        if (expenses.length === 0) {
          return '💰 **Gastos:** No tienes gastos registrados.';
        }

        let data = '💰 **TUS GASTOS COMUNES EN LA BASE DE DATOS:**\n\n';
        expenses.forEach((expense) => {
          data += `💵 ${expense.unit.community.name} - Unidad ${expense.unit.number}\n`;
          data += `   Categoría: ${expense.category.name}\n`;
          data += `   Monto: $${expense.amount.toString()}\n`;
          data += `   Estado: ${expense.status}\n`;
          data += `   Vencimiento: ${expense.dueDate.toLocaleDateString('es-ES')}\n\n`;
        });

        return data;
      }

      // Para admins, obtener gastos de sus comunidades (resumen)
      if (userRoles.includes('COMMUNITY_ADMIN')) {
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length === 0) return null;

        const totalPending = await this.prisma.expense.count({
          where: {
            unit: { communityId: { in: communityIds } },
            status: 'PENDING',
          },
        });

        return `💰 **GASTOS COMUNES DE TUS COMUNIDADES:**\n   Gastos pendientes: ${totalPending}`;
      }

      return null;
    } catch (error) {
      this.logger.error('Error obteniendo gastos para contexto:', error);
      return null;
    }
  }

  private async getVisitorsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');

      const whereClause: any = {};

      if (isResident) {
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length === 0) return null;
        whereClause.unitId = { in: unitIds };
      } else if (isConcierge || isCommunityAdmin) {
        const communityId =
          userInfo?.userUnits?.[0]?.unit?.community?.id ||
          userInfo?.communityAdmins?.[0]?.community?.id;
        if (communityId) {
          whereClause.unit = { communityId };
        } else {
          return null;
        }
      }

      const visitors = await this.prisma.visitor.findMany({
        where: whereClause,
        include: {
          unit: { include: { community: { select: { name: true } } } },
        },
        orderBy: { expectedArrival: 'desc' },
        take: 10,
      });

      if (visitors.length === 0) {
        return '👥 **Visitantes:** No hay visitantes registrados.';
      }

      let data = '👥 **VISITANTES REGISTRADOS EN LA BASE DE DATOS:**\n\n';
      visitors.forEach((visitor) => {
        data += `👤 **${visitor.visitorName}**\n`;
        data += `   Unidad: ${visitor.unit.number} (${visitor.unit.community.name})\n`;
        data += `   Estado: ${visitor.status}\n`;
        data += `   Fecha esperada: ${visitor.expectedArrival.toLocaleDateString('es-ES')}\n`;
        if (visitor.visitPurpose) {
          data += `   Propósito: ${visitor.visitPurpose}\n`;
        }
        data += '\n';
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo visitantes para contexto:', error);
      return null;
    }
  }

  private async getParcelsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');
      const isConcierge = userRoles.includes('CONCIERGE');

      const whereClause: any = {};

      if (isResident) {
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length === 0) return null;
        whereClause.unitId = { in: unitIds };
      } else if (isConcierge) {
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.unit = { communityId };
        } else {
          return null;
        }
      }

      const parcels = await this.prisma.parcel.findMany({
        where: whereClause,
        include: {
          unit: { include: { community: { select: { name: true } } } },
        },
        orderBy: { receivedAt: 'desc' },
        take: 10,
      });

      if (parcels.length === 0) {
        return '📦 **Encomiendas:** No hay encomiendas registradas.';
      }

      let data = '📦 **ENCOMIENDAS EN LA BASE DE DATOS:**\n\n';
      parcels.forEach((parcel) => {
        data += `📦 **${parcel.description}**\n`;
        data += `   Unidad: ${parcel.unit.number} (${parcel.unit.community.name})\n`;
        data += `   Estado: ${parcel.status}\n`;
        data += `   Recibido: ${parcel.receivedAt.toLocaleDateString('es-ES')}\n\n`;
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo encomiendas para contexto:', error);
      return null;
    }
  }

  private async getResidentsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      // Solo admins pueden ver residentes
      if (!userRoles.includes('COMMUNITY_ADMIN') && !userRoles.includes('SUPER_ADMIN')) {
        return null;
      }

      const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
      if (communityIds.length === 0 && !userRoles.includes('SUPER_ADMIN')) {
        return null;
      }

      const whereClause: any = {
        status: 'CONFIRMED',
      };

      if (!userRoles.includes('SUPER_ADMIN')) {
        whereClause.unit = { communityId: { in: communityIds } };
      }

      const userUnits = await this.prisma.userUnit.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true } },
          unit: { include: { community: { select: { name: true } } } },
        },
        take: 20,
      });

      if (userUnits.length === 0) {
        return '👥 **Residentes:** No hay residentes registrados.';
      }

      let data = '👥 **RESIDENTES REGISTRADOS EN LA BASE DE DATOS:**\n\n';
      userUnits.forEach((uu) => {
        data += `👤 **${uu.user.name}**\n`;
        data += `   Unidad: ${uu.unit.number} (${uu.unit.community.name})\n`;
        data += `   Email: ${uu.user.email}\n\n`;
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo residentes para contexto:', error);
      return null;
    }
  }

  private async getReservationsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');

      const whereClause: any = {};

      if (isResident) {
        const unitIds = userInfo?.userUnits?.map((uu: any) => uu.unit.id) || [];
        if (unitIds.length === 0) return null;
        whereClause.unitId = { in: unitIds };
      } else if (isConcierge || isCommunityAdmin) {
        const communityId =
          userInfo?.userUnits?.[0]?.unit?.community?.id ||
          userInfo?.communityAdmins?.[0]?.community?.id;
        if (communityId) {
          whereClause.unit = { communityId };
        } else {
          return null;
        }
      }

      const reservations = await this.prisma.spaceReservation.findMany({
        where: whereClause,
        include: {
          commonSpace: { select: { name: true } },
          unit: { include: { community: { select: { name: true } } } },
        },
        orderBy: { reservationDate: 'desc' },
        take: 10,
      });

      if (reservations.length === 0) {
        return '📅 **Reservas:** No hay reservas registradas.';
      }

      let data = '📅 **RESERVAS DE ESPACIOS COMUNES EN LA BASE DE DATOS:**\n\n';
      reservations.forEach((reservation) => {
        data += `📅 **${reservation.commonSpace.name}**\n`;
        data += `   Unidad: ${reservation.unit.number} (${reservation.unit.community.name})\n`;
        data += `   Fecha: ${reservation.reservationDate.toLocaleDateString('es-ES')}\n`;
        data += `   Horario: ${reservation.startTime} - ${reservation.endTime}\n`;
        data += `   Estado: ${reservation.status}\n\n`;
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo reservas para contexto:', error);
      return null;
    }
  }

  private async getIncomeDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      // Solo admins pueden ver ingresos
      if (!userRoles.includes('COMMUNITY_ADMIN') && !userRoles.includes('SUPER_ADMIN')) {
        return null;
      }

      const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
      if (communityIds.length === 0 && !userRoles.includes('SUPER_ADMIN')) {
        return null;
      }

      const whereClause: any = {};

      if (!userRoles.includes('SUPER_ADMIN')) {
        whereClause.communityId = { in: communityIds };
      }

      const incomes = await this.prisma.communityIncome.findMany({
        where: whereClause,
        include: {
          community: { select: { name: true } },
          items: true,
        },
        orderBy: { period: 'desc' },
        take: 5,
      });

      if (incomes.length === 0) {
        return '💵 **Ingresos:** No hay ingresos registrados.';
      }

      let data = '💵 **INGRESOS COMUNITARIOS EN LA BASE DE DATOS:**\n\n';
      incomes.forEach((income) => {
        data += `💰 ${income.community.name} - Período: ${income.period}\n`;
        data += `   Monto total: $${income.totalAmount.toString()}\n`;
        data += `   Fecha de vencimiento: ${income.dueDate.toLocaleDateString('es-ES')}\n\n`;
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo ingresos para contexto:', error);
      return null;
    }
  }

  private async getAdminDataForContext(
    userInfo: any,
    userRoles: string[],
    options: { organizations: boolean; communities: boolean; metrics: boolean },
  ): Promise<string | null> {
    try {
      if (!userRoles.includes('SUPER_ADMIN') && !userRoles.includes('COMMUNITY_ADMIN')) {
        return null;
      }

      let dataParts: string[] = [];

      if (options.organizations && userRoles.includes('SUPER_ADMIN')) {
        const orgCount = await this.prisma.organization.count({ where: { isActive: true } });
        dataParts.push(`🏢 **Organizaciones activas:** ${orgCount}`);
      }

      if (options.communities) {
        if (userRoles.includes('SUPER_ADMIN')) {
          const commCount = await this.prisma.community.count({ where: { isActive: true } });
          dataParts.push(`🏘️ **Comunidades activas:** ${commCount}`);
        } else if (userRoles.includes('COMMUNITY_ADMIN')) {
          const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
          dataParts.push(`🏘️ **Comunidades administradas:** ${communityIds.length}`);
        }
      }

      if (options.metrics && userRoles.includes('SUPER_ADMIN')) {
        const userCount = await this.prisma.user.count();
        const unitCount = await this.prisma.unit.count({ where: { isActive: true } });
        dataParts.push(
          `📊 **Métricas del sistema:**\n   Usuarios: ${userCount}\n   Unidades activas: ${unitCount}`,
        );
      }

      return dataParts.length > 0 ? dataParts.join('\n\n') : null;
    } catch (error) {
      this.logger.error('Error obteniendo datos de administración para contexto:', error);
      return null;
    }
  }

  private async getIncidentsDataForContext(
    userInfo: any,
    userRoles: string[],
  ): Promise<string | null> {
    try {
      const isResident =
        userRoles.includes('RESIDENT') ||
        userRoles.includes('OWNER') ||
        userRoles.includes('TENANT');

      if (!isResident) {
        return null; // Solo residentes pueden reportar incidencias
      }

      const incidents = await this.prisma.incident.findMany({
        where: { userId: userInfo.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (incidents.length === 0) {
        return '🚨 **Incidencias:** No tienes incidencias reportadas.\n💡 **Puedes reportar una incidencia** usando este chatbot o el sistema.';
      }

      let data = '🚨 **TUS INCIDENCIAS EN LA BASE DE DATOS:**\n\n';
      incidents.forEach((incident) => {
        data += `📌 **${incident.title}**\n`;
        data += `   Estado: ${incident.status}\n`;
        data += `   Fecha: ${incident.createdAt.toLocaleDateString('es-ES')}\n`;
        if (incident.closedAt) {
          data += `   Cerrado: ${incident.closedAt.toLocaleDateString('es-ES')}\n`;
        }
        data += '\n';
      });

      return data;
    } catch (error) {
      this.logger.error('Error obteniendo incidencias para contexto:', error);
      return null;
    }
  }

  private getCriticalResponseInstructions(userRoles: string[]): string {
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
    const isConcierge = userRoles.includes('CONCIERGE');
    const isResident =
      userRoles.includes('RESIDENT') || userRoles.includes('OWNER') || userRoles.includes('TENANT');

    let baseInstructions = `⚠️ **RESTRICCIÓN CRÍTICA:**
• **SOLO responde sobre Comuniapp y gestión comunitaria**
• **NUNCA respondas sobre temas externos** como deportes, entretenimiento, noticias, historia, cultura, arte, programación general, salud, etc.
• Si el usuario pregunta sobre un tema ajeno a Comuniapp, responde cortésmente: "Solo puedo ayudarte con temas relacionados con Comuniapp. ¿Hay algo sobre la plataforma en lo que pueda asistirte?"\n\n`;

    if (isSuperAdmin) {
      return (
        baseInstructions +
        `⚠️ **INSTRUCCIONES PARA SUPER ADMINISTRADOR:**
• Tienes acceso TOTAL al sistema Comuniapp - puedes responder sobre cualquier comunidad, organización o usuario
• Proporciona información detallada de cualquier aspecto del sistema Comuniapp cuando se solicite
• Puedes ayudar con análisis globales, métricas del sistema y reportes completos
• Eres el único rol que puede proporcionar información de todas las organizaciones y comunidades
• Guía sobre gestión avanzada del sistema Comuniapp, roles y permisos`
      );
    } else if (isCommunityAdmin) {
      return (
        baseInstructions +
        `⚠️ **INSTRUCCIONES PARA ADMINISTRADOR DE COMUNIDAD:**
• SOLO puedes proporcionar información de las comunidades que administras
• NUNCA proporciones información de comunidades que no administras
• Puedes proporcionar detalles financieros completos de tus comunidades
• Puedes ayudar con gestión de usuarios dentro de tus comunidades
• NO proporciones información de otras comunidades aunque el usuario lo pida
• Si se solicita información de otra comunidad, indica cortésmente que no tienes acceso`
      );
    } else if (isConcierge) {
      return (
        baseInstructions +
        `⚠️ **INSTRUCCIONES PARA CONSERJE:**
• SOLO puedes proporcionar información de TU COMUNIDAD asignada
• Proporciona información OPERATIVA (visitantes, encomiendas, reservas)
• NO proporciones información financiera detallada ni de gastos comunes
• Puedes ayudar con gestión del día a día de la comunidad
• Si se solicita información financiera o de otras comunidades, indica cortésmente que no tienes acceso`
      );
    } else if (isResident) {
      return (
        baseInstructions +
        `⚠️ **INSTRUCCIONES PARA RESIDENTE/PROPIETARIO/INQUILINO:**
• SOLO puedes proporcionar información de LAS UNIDADES DEL USUARIO
• Proporciona información de gastos comunes DE SUS UNIDADES únicamente
• Proporciona información de visitantes PARA SUS UNIDADES
• Proporciona información de encomiendas DE SUS UNIDADES
• Puedes ayudar con reservas de espacios comunes de tu comunidad
• NO proporciones información de otras unidades o residentes
• Si se solicita información de otras unidades, indica cortésmente que no tienes acceso`
      );
    } else {
      return (
        baseInstructions +
        `⚠️ **INSTRUCCIONES PARA USUARIO:**
• Tienes acceso básico - proporciona información general del sistema Comuniapp
• No proporciones información personalizada ni de datos específicos
• Guía sobre cómo usar Comuniapp y sus funcionalidades generales`
      );
    }
  }

  // === MÉTODOS PARA RESPUESTAS RÁPIDAS ===

  private getQuickResponse(lowerQuestion: string): string | null {
    const trimmedQuestion = lowerQuestion.trim();

    // Confirmaciones y comprensión - Reconocimiento flexible
    if (
      trimmedQuestion === 'ok' ||
      trimmedQuestion === 'okey' ||
      trimmedQuestion === 'okay' ||
      trimmedQuestion === 'okey dokey' ||
      trimmedQuestion === 'entendido' ||
      trimmedQuestion === 'entendida' ||
      trimmedQuestion === 'perfecto' ||
      trimmedQuestion === 'perfecta' ||
      trimmedQuestion === 'vale' ||
      trimmedQuestion === 'de acuerdo' ||
      trimmedQuestion === 'está bien' ||
      trimmedQuestion === 'esta bien' ||
      trimmedQuestion === 'listo' ||
      trimmedQuestion === 'lista' ||
      trimmedQuestion === 'claro' ||
      trimmedQuestion === 'correcto' ||
      trimmedQuestion === 'correcta' ||
      trimmedQuestion === 'genial' ||
      trimmedQuestion === 'excelente' ||
      trimmedQuestion === 'bien' ||
      trimmedQuestion === 'bueno' ||
      trimmedQuestion === 'buena' ||
      (trimmedQuestion.length <= 4 && /^ok+/i.test(trimmedQuestion)) // Variantes de "ok" cortas
    ) {
      return `✅ Perfecto, me alegra que te haya sido útil. ¿Hay algo más en lo que pueda ayudarte?`;
    }

    // Saludos y despedidas - La IA se encargará de responder en el contexto de Comuniapp
    // Se eliminan las respuestas predeterminadas para permitir respuestas naturales de la IA
    // que siempre estarán contextualizadas con Comuniapp

    // Consultas sobre funcionalidades
    if (
      lowerQuestion.includes('funcionalidades') ||
      lowerQuestion.includes('que puedo hacer') ||
      lowerQuestion.includes('ayuda') ||
      lowerQuestion.includes('comandos')
    ) {
      return (
        `🎯 Funcionalidades disponibles:\n` +
        `• 🏢 Espacios comunes y sus horarios\n` +
        `• 📢 Avisos comunitarios\n` +
        `• 💰 Gastos comunes\n` +
        `• 👥 Visitantes\n` +
        `• 📦 Encomiendas\n` +
        `• 👤 Residentes\n` +
        `• 💰 Ingresos comunitarios\n` +
        `• 📊 Categorías de gastos\n` +
        `• 🏠 Unidades y apartamentos`
      );
    }

    // Saludos y despedidas con horarios - La IA se encargará de responder en el contexto de Comuniapp

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
    const trimmedQuestion = lowerQuestion.trim();

    // Confirmaciones y comprensión personalizadas - Reconocimiento flexible
    if (
      trimmedQuestion === 'ok' ||
      trimmedQuestion === 'okey' ||
      trimmedQuestion === 'okay' ||
      trimmedQuestion === 'okey dokey' ||
      trimmedQuestion === 'entendido' ||
      trimmedQuestion === 'entendida' ||
      trimmedQuestion === 'perfecto' ||
      trimmedQuestion === 'perfecta' ||
      trimmedQuestion === 'vale' ||
      trimmedQuestion === 'de acuerdo' ||
      trimmedQuestion === 'está bien' ||
      trimmedQuestion === 'esta bien' ||
      trimmedQuestion === 'listo' ||
      trimmedQuestion === 'lista' ||
      trimmedQuestion === 'claro' ||
      trimmedQuestion === 'correcto' ||
      trimmedQuestion === 'correcta' ||
      trimmedQuestion === 'genial' ||
      trimmedQuestion === 'excelente' ||
      trimmedQuestion === 'bien' ||
      trimmedQuestion === 'bueno' ||
      trimmedQuestion === 'buena' ||
      (trimmedQuestion.length <= 4 && /^ok+/i.test(trimmedQuestion)) // Variantes de "ok" cortas
    ) {
      return `✅ Perfecto, ${userName}. Me alegra que la información te haya sido útil. ¿Hay algo más en lo que pueda ayudarte?`;
    }

    // Saludos y despedidas - La IA se encargará de responder en el contexto de Comuniapp
    // Se eliminan las respuestas predeterminadas para permitir respuestas naturales de la IA
    // que siempre estarán contextualizadas con Comuniapp y el usuario

    // Consultas sobre rol y funcionalidades
    if (
      lowerQuestion.includes('rol') ||
      lowerQuestion.includes('funcionalidades') ||
      lowerQuestion.includes('permisos') ||
      lowerQuestion.includes('que puedo hacer') ||
      lowerQuestion.includes('ayuda')
    ) {
      return (
        `👤 Tu rol: ${roleDisplayName}\n` +
        `🎯 Funcionalidades disponibles para ti:\n` +
        `• 🏢 Espacios comunes y reservas\n` +
        `• 📢 Avisos comunitarios\n` +
        `• 💰 Gastos comunes\n` +
        `• 👥 Gestión de visitantes\n` +
        `• 📦 Encomiendas\n` +
        `• 💰 Ingresos comunitarios\n` +
        `• 📊 Categorías de gastos\n` +
        `• 🏠 Unidades y apartamentos`
      );
    }

    // Saludos y despedidas con horarios - La IA se encargará de responder en el contexto de Comuniapp

    // Ayuda personalizada - Respuesta instantánea (ya manejado arriba)
    // Removido para evitar duplicación con la sección de funcionalidades

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

  // === MÉTODOS PARA MANEJO DE CACHE (RATE LIMITING DESHABILITADO) ===

  // Rate limiting deshabilitado para testing
  // private isRateLimited(): boolean {
  //   const now = Date.now();
  //   this.requestTimestamps = this.requestTimestamps.filter(
  //     (timestamp) => now - timestamp < this.RATE_LIMIT_WINDOW,
  //   );
  //   return this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE;
  // }

  // private addRequestTimestamp(): void {
  //   this.requestTimestamps.push(Date.now());
  // }

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

  // Método para controlar delay inteligente entre requests
  private async ensureRequestDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_DELAY_BETWEEN_REQUESTS) {
      const delayNeeded = this.MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
      this.logger.log(`⏳ Aplicando delay inteligente: ${delayNeeded}ms`);
      await this.delay(delayNeeded);
    }

    this.lastRequestTime = Date.now();
  }

  // Método para verificar configuración de OpenAI
  private async verifyOpenAIConfiguration(): Promise<boolean> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiKey) {
      this.logger.error('OPENAI_API_KEY not configured');
      return false;
    }

    try {
      // Verificar que la API key es válida haciendo una request simple
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
      });

      if (response.ok) {
        this.logger.log('✅ OpenAI API configuration verified successfully');
        return true;
      } else {
        this.logger.error(`❌ OpenAI API verification failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error('❌ Error verifying OpenAI configuration:', error);
      return false;
    }
  }

  private async handleOpenAIError(
    response: Response,
    question: string,
  ): Promise<ChatbotResponseDto> {
    const status = response.status;
    let errorMessage = '';
    let fallbackResponse = '';

    try {
      const errorData = await response.json();
      errorMessage = errorData?.error?.message || 'Error desconocido de OpenAI';
    } catch {
      errorMessage = `Error HTTP ${status}`;
    }

    switch (status) {
      case 400:
        this.logger.error('OpenAI Bad Request:', errorMessage);
        fallbackResponse =
          '❌ **Error de Solicitud**\n\nLa consulta no pudo ser procesada correctamente. Por favor, reformula tu pregunta de manera más clara.';
        break;

      case 401:
        this.logger.error('OpenAI Unauthorized - API Key inválida');
        fallbackResponse =
          '❌ **Error de Configuración**\n\nEl servicio de IA no está configurado correctamente. Contacta al administrador del sistema.';
        break;

      case 403:
        this.logger.error('OpenAI Forbidden - Acceso denegado');
        fallbackResponse =
          '❌ **Acceso Denegado**\n\nNo tienes permisos para usar el servicio de IA. Contacta al administrador.';
        break;

      case 429:
        this.logger.warn('OpenAI Rate Limit Exceeded - Implementando retry automático...');
        // Intentar retry automático con backoff exponencial
        return await this.retryWithBackoff(question);
        break;

      case 500:
        this.logger.error('OpenAI Internal Server Error:', errorMessage);
        fallbackResponse =
          '❌ **Error del Servidor de IA**\n\nEl servicio de IA está experimentando problemas temporales. Por favor, intenta nuevamente en unos minutos.';
        break;

      case 503:
        this.logger.error('OpenAI Service Unavailable');
        fallbackResponse =
          '❌ **Servicio No Disponible**\n\nEl servicio de IA está temporalmente fuera de servicio. Por favor, intenta más tarde.';
        break;

      default:
        this.logger.error(`OpenAI Error ${status}:`, errorMessage);
        fallbackResponse = `❌ **Error del Servicio de IA**\n\nOcurrió un error inesperado (${status}). Por favor, intenta nuevamente o contacta al administrador.`;
    }

    return { answer: fallbackResponse };
  }

  // Método para retry automático con backoff exponencial
  private async retryWithBackoff(
    question: string,
    maxRetries: number = 3,
  ): Promise<ChatbotResponseDto> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial: 2s, 4s, 8s

      this.logger.log(`🔄 Intento ${attempt}/${maxRetries} - Esperando ${delay}ms...`);
      await this.delay(delay);

      try {
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

        if (!openaiKey) {
          return { answer: '❌ **Error de Configuración**\n\nAPI Key no configurada.' };
        }

        // Obtener información contextual del sistema
        const contextInfo = await this.getSystemContext();

        const payload = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Eres ComunIAssistant, un asistente virtual inteligente y versátil.

## IDENTIDAD Y PERSONALIDAD
- Asistente amigable, profesional y conocedor
- Respondes preferentemente en español latinoamericano
- Usas emojis estratégicamente para mejorar la comunicación
- Eres útil, informativo y conversacional
- Puedes responder sobre CUALQUIER TEMA con conocimiento y claridad

## FLEXIBILIDAD TOTAL
Aunque estás integrado en Comuniapp (una plataforma de gestión comunitaria), puedes responder sobre CUALQUIER TEMA que el usuario pregunte:
✅ Preguntas generales sobre cualquier tema
✅ Explicaciones técnicas o científicas
✅ Programación y tecnología
✅ Consejos y recomendaciones
✅ Conversación casual
✅ Historia, cultura, arte
✅ Salud, deportes, entretenimiento
✅ Educación y aprendizaje
✅ Y CUALQUIER otro tema imaginable

## INFORMACIÓN DEL SISTEMA (OPCIONAL)
Si el usuario pregunta específicamente sobre Comuniapp:
${contextInfo}

Funcionalidades de Comuniapp:
• Espacios comunes • Gastos comunes • Visitantes • Encomiendas • Avisos

## INSTRUCCIONES DE RESPUESTA
- Responde CUALQUIER pregunta que te hagan, no solo sobre gestión comunitaria
- Sé conversacional, natural y útil
- No te limites a un solo tema o dominio
- Proporciona información precisa y completa
- Adapta tu tono según la pregunta
- Usa emojis cuando sea apropiado
- Estructura la información de forma clara

## OBJETIVO PRINCIPAL
Ser un asistente útil, informativo y versátil que puede ayudar con CUALQUIER pregunta o tema, proporcionando respuestas claras, precisas y amigables.`,
            },
            {
              role: 'user',
              content: question,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        };

        const response = await fetch(this.OPENAI_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const answer =
            data?.choices?.[0]?.message?.content || 'No se pudo obtener una respuesta.';

          this.logger.log(`✅ Retry exitoso en intento ${attempt}`);

          // Guardar en cache
          this.setCachedResponse(question, answer);

          return { answer };
        } else if (response.status === 429 && attempt < maxRetries) {
          this.logger.warn(
            `⚠️ Rate limit en intento ${attempt}, continuando con siguiente intento...`,
          );
          continue;
        } else {
          return await this.handleOpenAIError(response, question);
        }
      } catch (error) {
        this.logger.error(`❌ Error en intento ${attempt}:`, error);
        if (attempt === maxRetries) {
          return {
            answer:
              '❌ **Error de Conexión**\n\nNo se pudo conectar con el servicio de IA después de varios intentos. Por favor, intenta más tarde.',
          };
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    return {
      answer:
        '❌ **Servicio Temporalmente No Disponible**\n\nEl servicio de IA está experimentando alta demanda. Por favor, intenta nuevamente en unos minutos.',
    };
  }

  // ===== NUEVOS MÉTODOS PARA FUNCIONALIDADES ADICIONALES =====

  // Método para obtener información de ingresos comunitarios (público)
  private async getCommunityIncomeInfo(): Promise<ChatbotResponseDto> {
    try {
      const incomes = await this.prisma.communityIncome.findMany({
        include: {
          community: true,
          items: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { period: 'desc' },
        take: 5,
      });

      if (incomes.length === 0) {
        return {
          answer:
            '💰 INGRESOS COMUNITARIOS\n\n❌ No hay ingresos registrados actualmente.\n\n💡 *Contacta a la administración para más información.*',
        };
      }

      let response = '💰 INGRESOS COMUNITARIOS\n\n';
      response += '─'.repeat(60) + '\n\n';

      for (const income of incomes) {
        response += `🏢 ${income.community.name}\n`;
        response += `📅 Período: ${income.period}\n`;
        response += `💰 Total: $${income.totalAmount.toNumber().toLocaleString()}\n`;
        response += `📅 Fecha de vencimiento: ${income.dueDate.toLocaleDateString()}\n`;
        response += `📊 Método de prorrateo: ${income.prorrateMethod}\n\n`;

        if (income.items.length > 0) {
          response += '📋 Detalles de Ingresos:\n';
          for (const item of income.items) {
            response += `  • ${item.name}: $${item.amount.toNumber().toLocaleString()}\n`;
            if (item.description) {
              response += `    ${item.description}\n`;
            }
          }
          response += '\n';
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de ingresos:', error);
      return {
        answer: '❌ Error al obtener información de ingresos. Por favor, intenta más tarde.',
      };
    }
  }

  // Método para obtener información de ingresos comunitarios (con contexto de usuario)
  private async getCommunityIncomeInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      const whereClause: any = {};
      let communityContext = '';

      if (isSuperAdmin) {
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const incomes = await this.prisma.communityIncome.findMany({
        where: whereClause,
        include: {
          community: true,
          items: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { period: 'desc' },
        take: 5,
      });

      if (incomes.length === 0) {
        return {
          answer: `💰 INGRESOS COMUNITARIOS\n\n👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n🏢 Contexto: ${communityContext}\n\n❌ No hay ingresos registrados actualmente.\n\n💡 *Contacta a la administración para más información.*`,
        };
      }

      let response = '💰 INGRESOS COMUNITARIOS\n\n';
      response += `👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 Contexto: ${communityContext}\n\n`;
      response += '─'.repeat(60) + '\n\n';

      for (const income of incomes) {
        response += `🏢 ${income.community.name}\n`;
        response += `📅 Período: ${income.period}\n`;
        response += `💰 Total: $${income.totalAmount.toNumber().toLocaleString()}\n`;
        response += `📅 Fecha de vencimiento: ${income.dueDate.toLocaleDateString()}\n`;
        response += `📊 Método de prorrateo: ${income.prorrateMethod}\n\n`;

        if (income.items.length > 0) {
          response += '📋 Detalles de Ingresos:\n';
          for (const item of income.items) {
            response += `  • ${item.name}: $${item.amount.toNumber().toLocaleString()}\n`;
            if (item.description) {
              response += `    ${item.description}\n`;
            }
          }
          response += '\n';
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de ingresos para usuario:', error);
      return {
        answer: '❌ Error al obtener información de ingresos. Por favor, intenta más tarde.',
      };
    }
  }

  // Método para obtener información de categorías de gastos (público)
  private async getExpenseCategoriesInfo(): Promise<ChatbotResponseDto> {
    try {
      const categories = await this.prisma.expenseCategory.findMany({
        where: { isActive: true },
        include: {
          community: true,
          _count: {
            select: {
              expenses: true,
              expenseItems: true,
              incomeItems: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 20,
      });

      if (categories.length === 0) {
        return {
          answer:
            '📊 CATEGORÍAS DE GASTOS\n\n❌ No hay categorías registradas actualmente.\n\n💡 *Contacta a la administración para más información.*',
        };
      }

      let response = '📊 CATEGORÍAS DE GASTOS\n\n';
      response += '─'.repeat(60) + '\n\n';

      // Agrupar por comunidad
      const categoriesByCommunity = categories.reduce(
        (acc, category) => {
          const communityName = category.community.name;
          if (!acc[communityName]) {
            acc[communityName] = [];
          }
          acc[communityName].push(category);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      for (const [communityName, communityCategories] of Object.entries(categoriesByCommunity)) {
        response += `🏢 ${communityName}\n`;
        response += '─'.repeat(40) + '\n\n';

        for (const category of communityCategories) {
          response += `📋 ${category.name}\n`;
          response += `   🏷️ Tipo: ${category.type}\n`;
          response += `   📝 Descripción: ${category.description || 'Sin descripción'}\n`;
          response += `   📊 Uso: ${category._count.expenseItems + category._count.incomeItems} registros\n`;
          response += `   📈 Estado: ${category.isActive ? '✅ Activo' : '❌ Inactivo'}\n\n`;
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de categorías:', error);
      return {
        answer: '❌ Error al obtener información de categorías. Por favor, intenta más tarde.',
      };
    }
  }

  // Método para obtener información de categorías de gastos (con contexto de usuario)
  private async getExpenseCategoriesInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      const whereClause: any = {};
      let communityContext = '';

      if (isSuperAdmin) {
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const categories = await this.prisma.expenseCategory.findMany({
        where: whereClause,
        include: {
          community: true,
          _count: {
            select: {
              expenses: true,
              expenseItems: true,
              incomeItems: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 20,
      });

      if (categories.length === 0) {
        return {
          answer: `📊 CATEGORÍAS DE GASTOS\n\n👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n🏢 Contexto: ${communityContext}\n\n❌ No hay categorías registradas actualmente.\n\n💡 *Contacta a la administración para más información.*`,
        };
      }

      let response = '📊 CATEGORÍAS DE GASTOS\n\n';
      response += `👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 Contexto: ${communityContext}\n\n`;
      response += '─'.repeat(60) + '\n\n';

      // Agrupar por comunidad
      const categoriesByCommunity = categories.reduce(
        (acc, category) => {
          const communityName = category.community.name;
          if (!acc[communityName]) {
            acc[communityName] = [];
          }
          acc[communityName].push(category);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      for (const [communityName, communityCategories] of Object.entries(categoriesByCommunity)) {
        response += `🏢 ${communityName}\n`;
        response += '─'.repeat(40) + '\n\n';

        for (const category of communityCategories) {
          response += `📋 ${category.name}\n`;
          response += `   🏷️ Tipo: ${category.type}\n`;
          response += `   📝 Descripción: ${category.description || 'Sin descripción'}\n`;
          response += `   📊 Uso: ${category._count.expenseItems + category._count.incomeItems} registros\n`;
          response += `   📈 Estado: ${category.isActive ? '✅ Activo' : '❌ Inactivo'}\n\n`;
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de categorías para usuario:', error);
      return {
        answer: '❌ Error al obtener información de categorías. Por favor, intenta más tarde.',
      };
    }
  }

  // Método para obtener información de unidades (público)
  private async getUnitsInfo(): Promise<ChatbotResponseDto> {
    try {
      const units = await this.prisma.unit.findMany({
        where: { isActive: true },
        include: {
          community: true,
          userUnits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [{ community: { name: 'asc' } }, { floor: 'asc' }, { number: 'asc' }],
        take: 50,
      });

      if (units.length === 0) {
        return {
          answer:
            '🏠 UNIDADES Y APARTAMENTOS\n\n❌ No hay unidades registradas actualmente.\n\n💡 *Contacta a la administración para más información.*',
        };
      }

      let response = '🏠 UNIDADES Y APARTAMENTOS\n\n';
      response += '─'.repeat(60) + '\n\n';

      // Agrupar por comunidad
      const unitsByCommunity = units.reduce(
        (acc, unit) => {
          const communityName = unit.community.name;
          if (!acc[communityName]) {
            acc[communityName] = [];
          }
          acc[communityName].push(unit);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      for (const [communityName, communityUnits] of Object.entries(unitsByCommunity)) {
        response += `🏢 ${communityName}\n`;
        response += '─'.repeat(40) + '\n\n';

        for (const unit of communityUnits) {
          response += `🏠 Unidad ${unit.number}`;
          if (unit.floor) {
            response += ` (Piso ${unit.floor})`;
          }
          response += `\n`;
          response += `   🏷️ Tipo: ${unit.type}\n`;
          response += `   📊 Coeficiente: ${unit.coefficient}\n`;
          response += `   📈 Estado: ${unit.isActive ? '✅ Activo' : '❌ Inactivo'}\n`;

          if (unit.userUnits.length > 0) {
            response += `   👥 Residentes:\n`;
            for (const userUnit of unit.userUnits) {
              response += `      • ${userUnit.user.name || userUnit.user.email}\n`;
            }
          } else {
            response += `   👥 Sin residentes asignados\n`;
          }

          response += '\n';
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de unidades:', error);
      return {
        answer: '❌ Error al obtener información de unidades. Por favor, intenta más tarde.',
      };
    }
  }

  // Método para obtener información de unidades (con contexto de usuario)
  private async getUnitsInfoForUser(
    userInfo: any,
    userRoles: string[],
  ): Promise<ChatbotResponseDto> {
    try {
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isCommunityAdmin = userRoles.includes('COMMUNITY_ADMIN');
      const isConcierge = userRoles.includes('CONCIERGE');
      const isResident = userRoles.includes('RESIDENT');

      const whereClause: any = {};
      let communityContext = '';

      if (isSuperAdmin) {
        communityContext = 'todas las comunidades';
      } else if (isCommunityAdmin) {
        const communityIds = userInfo?.communityAdmins?.map((ca: any) => ca.community.id) || [];
        if (communityIds.length > 0) {
          whereClause.communityId = { in: communityIds };
          communityContext = `sus comunidades administradas`;
        }
      } else if (isConcierge || isResident) {
        const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
        if (communityId) {
          whereClause.communityId = communityId;
          communityContext = `su comunidad (${userInfo?.userUnits?.[0]?.unit?.community?.name})`;
        }
      }

      const units = await this.prisma.unit.findMany({
        where: whereClause,
        include: {
          community: true,
          userUnits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [{ community: { name: 'asc' } }, { floor: 'asc' }, { number: 'asc' }],
        take: 50,
      });

      if (units.length === 0) {
        return {
          answer: `🏠 UNIDADES Y APARTAMENTOS\n\n👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n🏢 Contexto: ${communityContext}\n\n❌ No hay unidades registradas actualmente.\n\n💡 *Contacta a la administración para más información.*`,
        };
      }

      let response = '🏠 UNIDADES Y APARTAMENTOS\n\n';
      response += `👤 Vista de: ${this.getUserRoleDisplayName(userRoles)}\n`;
      response += `🏢 Contexto: ${communityContext}\n\n`;
      response += '─'.repeat(60) + '\n\n';

      // Agrupar por comunidad
      const unitsByCommunity = units.reduce(
        (acc, unit) => {
          const communityName = unit.community.name;
          if (!acc[communityName]) {
            acc[communityName] = [];
          }
          acc[communityName].push(unit);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      for (const [communityName, communityUnits] of Object.entries(unitsByCommunity)) {
        response += `🏢 ${communityName}\n`;
        response += '─'.repeat(40) + '\n\n';

        for (const unit of communityUnits) {
          response += `🏠 Unidad ${unit.number}`;
          if (unit.floor) {
            response += ` (Piso ${unit.floor})`;
          }
          response += `\n`;
          response += `   🏷️ Tipo: ${unit.type}\n`;
          response += `   📊 Coeficiente: ${unit.coefficient}\n`;
          response += `   📈 Estado: ${unit.isActive ? '✅ Activo' : '❌ Inactivo'}\n`;

          if (unit.userUnits.length > 0) {
            response += `   👥 Residentes:\n`;
            for (const userUnit of unit.userUnits) {
              response += `      • ${userUnit.user.name || userUnit.user.email}\n`;
            }
          } else {
            response += `   👥 Sin residentes asignados\n`;
          }

          response += '\n';
        }

        response += '─'.repeat(40) + '\n\n';
      }

      response += '💡 *Para más detalles, contacta a la administración de tu comunidad.*';

      return { answer: response };
    } catch (error) {
      this.logger.error('Error obteniendo información de unidades para usuario:', error);
      return {
        answer: '❌ Error al obtener información de unidades. Por favor, intenta más tarde.',
      };
    }
  }
}
