import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ChatbotService } from '../services/chatbotService';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'system';
}

export default function Chatbot() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Generar mensaje de bienvenida personalizado
  const getWelcomeMessage = (): string => {
    if (!isAuthenticated || !user) {
      return '¡Hola! 👋 Soy el asistente virtual de Comuniapp. ¿En qué puedo ayudarte hoy?';
    }

    const userName = typeof user.name === 'string' ? user.name : 'Usuario';
    const userRoles =
      user.roles
        ?.map((role) => {
          if (typeof role === 'object' && role !== null && 'name' in role) {
            return typeof role.name === 'string' ? role.name : '';
          }
          return '';
        })
        .filter(Boolean)
        .join(', ') || '';

    return `¡Hola ${userName}! 👋 Soy tu asistente virtual de Comuniapp. Como ${userRoles.toLowerCase()}, puedo ayudarte con información específica de tu rol. ¿En qué puedo asistirte hoy?`;
  };

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
      type: 'system',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Actualizar mensaje de bienvenida cuando cambie el estado de autenticación
  useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[0].type === 'system') {
        const welcomeText = getWelcomeMessage();
        newMessages[0] = {
          ...newMessages[0],
          text:
            typeof welcomeText === 'string'
              ? welcomeText
              : '¡Hola! 👋 Soy el asistente virtual de Comuniapp.',
        };
      }
      return newMessages;
    });
  }, [isAuthenticated, user]);

  // Generar acciones rápidas basadas en el rol del usuario
  const getQuickActions = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: 'Información General', icon: 'ℹ️', query: 'información general' },
        { label: 'Cómo Registrarse', icon: '📝', query: 'cómo registrarse' },
        { label: 'Contacto', icon: '📞', query: 'contacto' },
      ];
    }

    const actions = [];
    const userRoles =
      user.roles
        ?.map((role) => {
          if (typeof role === 'object' && role !== null && 'name' in role) {
            return typeof role.name === 'string' ? role.name : '';
          }
          return '';
        })
        .filter(Boolean) || [];

    // Acciones básicas para todos los usuarios autenticados
    actions.push({ label: 'Avisos', icon: '📢', query: 'avisos' });

    // Acciones específicas según roles
    if (userRoles.includes('SUPER_ADMIN')) {
      actions.push(
        { label: 'Organizaciones', icon: '🏢', query: 'organizaciones' },
        { label: 'Usuarios', icon: '👥', query: 'usuarios del sistema' },
        { label: 'Métricas', icon: '📊', query: 'métricas del sistema' },
        { label: 'Comunidades', icon: '🏘️', query: 'comunidades' },
        { label: 'Espacios Comunes', icon: '🏢', query: 'espacios comunes' },
        { label: 'Gastos Comunes', icon: '💰', query: 'gastos comunes' },
      );
    } else if (userRoles.includes('COMMUNITY_ADMIN')) {
      actions.push(
        { label: 'Gastos Comunes', icon: '💰', query: 'gastos comunes' },
        { label: 'Residentes', icon: '👥', query: 'residentes' },
        { label: 'Espacios Comunes', icon: '🏢', query: 'espacios comunes' },
        { label: 'Ingresos', icon: '💵', query: 'ingresos' },
        { label: 'Visitantes', icon: '👤', query: 'visitantes' },
        { label: 'Encomiendas', icon: '📦', query: 'encomiendas' },
      );
    } else if (userRoles.includes('CONCIERGE')) {
      actions.push(
        { label: 'Visitantes', icon: '👥', query: 'visitantes' },
        { label: 'Encomiendas', icon: '📦', query: 'encomiendas' },
        { label: 'Reservas', icon: '📅', query: 'reservas' },
        { label: 'Espacios Comunes', icon: '🏢', query: 'espacios comunes' },
      );
    } else if (
      userRoles.includes('RESIDENT') ||
      userRoles.includes('OWNER') ||
      userRoles.includes('TENANT')
    ) {
      actions.push(
        { label: 'Gastos Comunes', icon: '💰', query: 'gastos comunes' },
        { label: 'Cuánto Debo', icon: '💸', query: 'cuanto debo' },
        { label: 'Visitantes', icon: '👥', query: 'visitantes' },
        { label: 'Encomiendas', icon: '📦', query: 'encomiendas' },
        { label: 'Espacios Comunes', icon: '🏢', query: 'espacios comunes' },
        { label: 'Reservas', icon: '📅', query: 'reservas' },
      );
    }

    return actions;
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputText.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = messageToSend;
    setInputText('');
    setIsLoading(true);

    try {
      // Llamar a la API del chatbot - usar endpoint autenticado si el usuario está logueado
      const response = isAuthenticated
        ? await ChatbotService.sendMessageAuth(currentInput)
        : await ChatbotService.sendMessage(currentInput);

      // Asegurar que la respuesta sea un string
      const answerText =
        typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answerText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error calling chatbot API:', error);

      let errorMessage =
        'Lo siento, no pude procesar tu solicitud en este momento. Por favor, intenta nuevamente.';

      // Verificar si es un error de autenticación
      if (error?.response?.status === 401) {
        errorMessage =
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente para usar el chatbot.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'No tienes permisos para usar el chatbot. Contacta al administrador.';
      } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
        errorMessage = 'No se puede conectar al servidor. Verifica tu conexión a internet.';
      }

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSendMessage(query);
  };

  return (
    <>
      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0ea5e9', '#3b82f6', '#8b5cf6']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal del chat */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <LinearGradient colors={['#0ea5e9', '#3b82f6', '#8b5cf6']} style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Asistente Virtual</Text>
                    <Text style={styles.modalSubtitle}>Comuniapp</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.botAvatarSmall}>
                      <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.botMessageText,
                      ]}
                    >
                      {typeof message.text === 'string' ? message.text : String(message.text || '')}
                    </Text>
                    <Text style={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageContainer, styles.botMessage]}>
                  <View style={styles.botAvatarSmall}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                  </View>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <ActivityIndicator size="small" color="#6B7280" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Acciones rápidas:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {getQuickActions().map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickActionButton}
                      onPress={() => handleQuickAction(action.query)}
                    >
                      <Text style={styles.quickActionIcon}>{action.icon}</Text>
                      <Text style={styles.quickActionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSendMessage()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient colors={['#0ea5e9', '#3b82f6']} style={styles.sendButtonGradient}>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 100,
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  quickActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
