const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ChatbotResponse {
  answer: string;
}

export class ChatbotService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token'); // Obtener token del localStorage

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async sendMessage(question: string): Promise<ChatbotResponse> {
    try {
      const response = await this.makeRequest(`/chatbot?q=${encodeURIComponent(question)}`);
      return response;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  }

  static async sendMessageAuth(question: string): Promise<ChatbotResponse> {
    try {
      const response = await this.makeRequest(`/chatbot/auth?q=${encodeURIComponent(question)}`);
      return response;
    } catch (error) {
      console.error('Error sending authenticated message to chatbot:', error);
      throw error;
    }
  }
}
