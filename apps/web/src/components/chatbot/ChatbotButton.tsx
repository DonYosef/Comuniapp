'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';

interface ChatbotButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export default function ChatbotButton({ onClick, isOpen, unreadCount = 0 }: ChatbotButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Notificación de mensajes no leídos */}
      {unreadCount > 0 && !isOpen && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}

      {/* Botón principal del chatbot */}
      <button
        onClick={onClick}
        className={`
          group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
          transform hover:scale-110 active:scale-95
          ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
          flex items-center justify-center
        `}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {/* Efecto de ondas */}
        <div
          className={`
          absolute inset-0 rounded-full animate-ping opacity-20
          ${isOpen ? 'bg-red-500' : 'bg-blue-600'}
        `}
        />

        {/* Icono */}
        <div className="relative z-10">
          {isOpen ? (
            <XMarkIcon className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" />
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {isOpen ? 'Cerrar chat' : 'Chatea con nosotros'}
        </div>
      </button>
    </div>
  );
}
