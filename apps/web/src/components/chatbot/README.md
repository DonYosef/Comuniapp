# Chatbot Component

## Descripción

Componente de chatbot moderno y funcional para la plataforma Comuniapp. Incluye un botón flotante en la esquina inferior derecha que se expande en una ventana de chat interactiva.

## Características

### 🎨 Diseño Moderno

- **Botón flotante** con animaciones suaves y efectos visuales
- **Ventana de chat** con diseño tipo modal moderno
- **Tema oscuro/claro** compatible con el sistema de temas de la aplicación
- **Responsive** y optimizado para diferentes tamaños de pantalla

### ⚡ Funcionalidades

- **Chat en tiempo real** con simulación de respuestas del bot
- **Indicador de mensajes no leídos** con contador animado
- **Estados minimizado/expandido** para mejor UX
- **Acciones rápidas** para consultas comunes
- **Auto-scroll** a los mensajes más recientes
- **Typing indicator** durante las respuestas del bot

### 🛠️ Componentes

#### `ChatbotButton.tsx`

- Botón flotante principal
- Animaciones de hover y click
- Indicador de mensajes no leídos
- Tooltip informativo

#### `ChatbotWindow.tsx`

- Ventana principal del chat
- Lista de mensajes con timestamps
- Input de texto con envío por Enter
- Acciones rápidas predefinidas
- Footer con información de contacto

#### `Chatbot.tsx`

- Componente principal que orquesta todo
- Manejo de estados (abierto/cerrado/minimizado)
- Lógica de contador de mensajes no leídos

## Uso

El chatbot se integra automáticamente en el layout principal de la aplicación:

```tsx
import { Chatbot } from '@/components/chatbot';

// En el layout principal
<Chatbot />;
```

## Personalización

### Respuestas del Bot

Las respuestas se generan en la función `getBotResponse()` en `ChatbotWindow.tsx`. Puedes personalizar las respuestas según las necesidades de tu comunidad:

```typescript
const getBotResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();

  if (input.includes('pago') || input.includes('gasto')) {
    return 'Respuesta personalizada para gastos...';
  }

  // Agregar más casos según necesidades
};
```

### Acciones Rápidas

Modifica el array `quickActions` en `ChatbotWindow.tsx`:

```typescript
const quickActions = [
  { label: 'Gastos Comunes', icon: '💰' },
  { label: 'Registrar Visita', icon: '👥' },
  // Agregar más acciones
];
```

### Estilos

Los estilos están implementados con Tailwind CSS y son completamente personalizables. Los colores principales son:

- **Azul**: `blue-600` para el botón y elementos principales
- **Rojo**: `red-500` para notificaciones y botón de cerrar
- **Verde**: `green-500` para el botón minimizado

## Integración con Backend

Para conectar con un backend real, modifica la función `handleSendMessage()` en `ChatbotWindow.tsx`:

```typescript
const handleSendMessage = async () => {
  // ... código existente ...

  // Reemplazar la simulación con llamada real a la API
  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputText.trim() }),
    });

    const data = await response.json();
    // Procesar respuesta del backend
  } catch (error) {
    // Manejar errores
  }
};
```

## Accesibilidad

- **ARIA labels** en todos los botones interactivos
- **Navegación por teclado** (Enter para enviar mensajes)
- **Contraste adecuado** para texto y fondos
- **Indicadores visuales** claros para estados

## Rendimiento

- **Lazy loading** de componentes pesados
- **Debounce** en el input para evitar llamadas excesivas
- **Memoización** de componentes cuando sea necesario
- **Cleanup** de timers y listeners

## Próximas Mejoras

- [ ] Integración con WebSocket para chat en tiempo real
- [ ] Soporte para archivos multimedia
- [ ] Historial de conversaciones persistente
- [ ] Múltiples idiomas
- [ ] Integración con sistema de tickets
- [ ] Analytics de conversaciones
