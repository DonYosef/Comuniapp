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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! 👋 Soy el asistente virtual de Comuniapp. ¿En qué puedo ayudarte hoy?',
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(
      () => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(inputText.trim()),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    );
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('pago') || input.includes('gasto')) {
      return 'Para consultas sobre pagos y gastos comunes, puedes acceder al módulo de "Gastos Comunes" en el dashboard. ¿Te gustaría que te explique cómo registrar un nuevo gasto?';
    }

    if (input.includes('visita') || input.includes('visitante')) {
      return 'El módulo de visitas te permite registrar y gestionar visitantes. Puedes crear una nueva visita desde el panel de "Control de Visitas". ¿Necesitas ayuda con algún proceso específico?';
    }

    if (input.includes('encomienda') || input.includes('paquete')) {
      return 'Las encomiendas se gestionan en el módulo correspondiente. Puedes registrar la llegada de paquetes y notificar a los residentes. ¿Quieres que te muestre cómo hacerlo?';
    }

    if (input.includes('reserva') || input.includes('espacio')) {
      return 'Para reservar espacios comunes como salas de juntas o áreas recreativas, utiliza el sistema de reservas. ¿Qué tipo de espacio necesitas reservar?';
    }

    if (input.includes('incidencia') || input.includes('problema')) {
      return 'Puedes reportar incidencias o solicitudes desde el módulo correspondiente. Esto nos ayuda a mantener la comunidad en óptimas condiciones. ¿Qué tipo de incidencia quieres reportar?';
    }

    if (input.includes('ayuda') || input.includes('help')) {
      return 'Estoy aquí para ayudarte con cualquier consulta sobre Comuniapp. Puedo asistirte con: pagos, visitas, encomiendas, reservas, incidencias y más. ¿Qué necesitas saber?';
    }

    return 'Gracias por tu mensaje. Un miembro de nuestro equipo te responderá pronto. Mientras tanto, puedes explorar los diferentes módulos de la plataforma o contactarnos directamente.';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Gastos Comunes', icon: '💰' },
    { label: 'Registrar Visita', icon: '👥' },
    { label: 'Encomiendas', icon: '📦' },
    { label: 'Reservar Espacio', icon: '🏢' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 h-[28rem] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <CpuChipIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Asistente Virtual</h3>
            <p className="text-blue-100 text-xs">En línea</p>
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
                max-w-sm px-4 py-3 rounded-2xl text-sm
                ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }
              `}
            >
              <p>{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
