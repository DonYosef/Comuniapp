import api from '../config/api';

export interface ChatbotResponse {
  answer: string;
}

export class ChatbotService {
  static async sendMessage(question: string): Promise<ChatbotResponse> {
    const response = await api.get<ChatbotResponse>('/chatbot', {
      params: { q: question },
    });
    return response.data;
  }

  static async sendMessageAuth(question: string): Promise<ChatbotResponse> {
    const response = await api.get<ChatbotResponse>('/chatbot/auth', {
      params: { q: question },
    });
    return response.data;
  }
}
