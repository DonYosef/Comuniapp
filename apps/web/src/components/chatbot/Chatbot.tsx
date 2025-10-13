'use client';

import { useState, useEffect } from 'react';
import ChatbotButton from './ChatbotButton';
import ChatbotWindow from './ChatbotWindow';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simular mensajes no leídos (en una implementación real, esto vendría de un estado global o API)
  useEffect(() => {
    if (!isOpen && !isMinimized) {
      const interval = setInterval(() => {
        setUnreadCount((prev) => Math.min(prev + 1, 9));
      }, 30000); // Simular un mensaje cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(true);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0); // Limpiar contador al abrir
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  return (
    <>
      {/* Botón flotante */}
      <ChatbotButton onClick={handleToggle} isOpen={isOpen} unreadCount={unreadCount} />

      {/* Ventana del chat */}
      {isOpen && (
        <ChatbotWindow isOpen={isOpen} onClose={handleClose} onMinimize={handleMinimize} />
      )}

      {/* Botón minimizado */}
      {isMinimized && !isOpen && (
        <div className="fixed bottom-6 right-24 z-50">
          <button
            onClick={handleRestore}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Restaurar chat"
          >
            <div className="relative">
              <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
          </button>
        </div>
      )}
    </>
  );
}
