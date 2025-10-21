'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  CpuChipIcon,
  UserIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ChatbotService } from '../../services/chatbot.service';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'system';
}

interface ChatbotWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export default function ChatbotWindow({ isOpen, onClose, onMinimize }: ChatbotWindowProps) {
  const { user, isAuthenticated, hasRole, hasPermission, isAdmin } = useAuth();

  // Generar mensaje de bienvenida personalizado
  const getWelcomeMessage = () => {
    if (!isAuthenticated || !user) {
      return '¡Hola! 👋 Soy el asistente virtual de Comuniapp. ¿En qué puedo ayudarte hoy?';
    }

    const userName = user.name || 'Usuario';
    const userRoles = user.roles?.map((role) => role.name).join(', ') || '';

    return `¡Hola ${userName}! 👋 Soy tu asistente virtual de Comuniapp. Como ${userRoles.toLowerCase()}, puedo ayudarte con información específica de tu rol. ¿En qué puedo asistirte hoy?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
      type: 'system',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Actualizar mensaje de bienvenida cuando cambie el estado de autenticación
  useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[0].type === 'system') {
        newMessages[0] = {
          ...newMessages[0],
          text: getWelcomeMessage(),
        };
      }
      return newMessages;
    });
  }, [isAuthenticated, user]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Llamar a la API del chatbot - usar endpoint autenticado si el usuario está logueado
      const response = isAuthenticated
        ? await ChatbotService.sendMessageAuth(currentInput)
        : await ChatbotService.sendMessage(currentInput);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling chatbot API:', error);

      let errorMessage =
        'Lo siento, no pude procesar tu solicitud en este momento. Por favor, intenta nuevamente.';

      // Verificar si es un error de autenticación
      if (error instanceof Error && error.message.includes('401')) {
        errorMessage =
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente para usar el chatbot.';
      } else if (error instanceof Error && error.message.includes('403')) {
        errorMessage = 'No tienes permisos para usar el chatbot. Contacta al administrador.';
      }

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Función para generar acciones rápidas basadas en el rol y permisos del usuario
  const getQuickActions = () => {
    if (!isAuthenticated || !user) {
      // Acciones para usuarios no autenticados
      return [
        { label: 'información general', icon: 'ℹ️' },
        { label: 'cómo registrarse', icon: '📝' },
        { label: 'contacto', icon: '📞' },
      ];
    }

    const actions = [];

    // Acciones básicas para todos los usuarios autenticados
    actions.push({ label: 'avisos', icon: '📢' }, { label: 'mi perfil', icon: '👤' });

    // Acciones específicas según roles y permisos
    if (hasRole('SUPER_ADMIN')) {
      actions.push(
        { label: 'gestión de organizaciones', icon: '🏢' },
        { label: 'usuarios del sistema', icon: '👥' },
        { label: 'métricas del sistema', icon: '📊' },
        { label: 'configuración global', icon: '⚙️' },
      );
    }

    if (hasRole('COMMUNITY_ADMIN')) {
      actions.push(
        { label: 'gestión de comunidad', icon: '🏘️' },
        { label: 'residentes', icon: '👥' },
        { label: 'gastos comunes', icon: '💰' },
        { label: 'reportes', icon: '📊' },
      );
    }

    if (hasRole('CONCIERGE')) {
      actions.push(
        { label: 'visitantes', icon: '👥' },
        { label: 'encomiendas', icon: '📦' },
        { label: 'reservas', icon: '📅' },
        { label: 'espacios comunes', icon: '🏢' },
      );
    }

    if (hasRole('RESIDENT') || hasRole('OWNER') || hasRole('TENANT')) {
      actions.push(
        { label: 'mis gastos', icon: '💰' },
        { label: 'mis visitantes', icon: '👥' },
        { label: 'mis encomiendas', icon: '📦' },
        { label: 'reportar problema', icon: '🚨' },
      );
    }

    // Acciones adicionales basadas en permisos específicos
    if (hasPermission('manage_community_expenses')) {
      actions.push({ label: 'gastos comunes', icon: '💰' });
    }

    if (hasPermission('manage_visitors')) {
      actions.push({ label: 'visitantes', icon: '👥' });
    }

    if (hasPermission('manage_parcels')) {
      actions.push({ label: 'encomiendas', icon: '📦' });
    }

    if (hasPermission('manage_reservations')) {
      actions.push({ label: 'reservas', icon: '📅' });
    }

    // Eliminar duplicados y limitar a 6 acciones máximo
    const uniqueActions = actions
      .filter((action, index, self) => index === self.findIndex((a) => a.label === action.label))
      .slice(0, 6);

    return uniqueActions;
  };

  const quickActions = getQuickActions();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[28rem] h-[36rem] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <CpuChipIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Asistente Virtual</h3>
            <p className="text-blue-100 text-xs">
              {isAuthenticated && user
                ? `${user.name} - ${user.roles?.map((role) => role.name).join(', ') || 'Usuario'}`
                : 'En línea'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-1 text-white hover:bg-blue-500 rounded transition-colors"
            aria-label="Minimizar"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-white hover:bg-blue-500 rounded transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-md px-4 py-3 rounded-2xl text-sm
                ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                }
              `}
            >
              {message.isUser ? <p>{message.text}</p> : <p>{message.text}</p>}
              <p
                className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-white'
                }`}
              >
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInputText(action.label)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <PhoneIcon className="w-3 h-3" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="w-3 h-3" />
            <span>soporte@comuniapp.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
