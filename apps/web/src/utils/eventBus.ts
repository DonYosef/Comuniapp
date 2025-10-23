// Sistema de eventos global para comunicación entre componentes
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  // Suscribirse a un evento
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Desuscribirse de un evento
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  // Emitir un evento
  emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error en callback del evento:', event, error);
        }
      });
    }
  }

  // Limpiar todos los listeners
  clear() {
    this.listeners.clear();
  }
}

// Instancia global del event bus
export const eventBus = new EventBus();

// Eventos específicos
export const EVENTS = {
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_DELETED: 'expense:deleted',
  EXPENSE_UPDATED: 'expense:updated',
  INCOME_CREATED: 'income:created',
  INCOME_DELETED: 'income:deleted',
  INCOME_UPDATED: 'income:updated',
  DATA_REFRESH_NEEDED: 'data:refresh_needed',
} as const;
