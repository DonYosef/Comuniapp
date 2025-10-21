'use client';

import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const exampleResponse = `¡Hola, **prueba**! 👋 Como conserje tienes acceso total a la gestión de **reservas** de los espacios comunes. Aquí tienes un resumen rápido de lo que puedes hacer y cómo aprovechar el sistema:

---

### 📅 Qué puedes gestionar

| Acción | Qué hace | Cómo iniciar |
|--------|----------|--------------|
| **Crear una reserva** | Reservar gimnasio, sala de eventos, piscina, etc. | Busca el espacio disponible con la palabra clave **"espacios comunes"** y elige la hora que necesites. |
| **Modificar una reserva** | Cambiar fecha, hora o tipo de espacio. | Ve a la lista de reservas activas y selecciona la que deseas editar. |
| **Cancelar una reserva** | Liberar el espacio para que otros residentes lo usen. | Accede a la reserva y elige **Cancelar**. |
| **Consultar disponibilidad** | Ver horarios libres de cada espacio. | Usa **"espacios comunes"** para obtener el calendario actualizado. |

---

### 🛠️ Pasos rápidos para una reserva

1. **Consultar espacios**: escribe \`espacios comunes\`.
2. **Seleccionar** el espacio y el horario que mejor se ajuste.
3. **Confirmar** la reserva (el sistema te mostrará una vista previa).
4. **Guardar** → recibirás un aviso automático al residente y al registro de reservas.

---

### 🤝 ¿Necesitas ayuda con algo en particular?

- ¿Quieres crear una reserva ahora mismo?
- ¿Necesitas verificar o modificar una reserva existente?
- ¿Buscas información sobre horarios de algún espacio en concreto?

Solo dime y te guío paso a paso.

---

¡Estoy aquí para cualquier duda que tengas! 😊`;

export default function ChatbotDemo() {
  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
        <MarkdownRenderer content={exampleResponse} />
        <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">14:30</p>
      </div>
    </div>
  );
}
