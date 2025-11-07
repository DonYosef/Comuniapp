import axios, { AxiosInstance } from 'axios';

// URL base de la API - ajustar según tu entorno
// Para Android emulator usar 10.0.2.2, para iOS simulator usar localhost
// Para dispositivo físico Android/iOS, usar la IP de tu máquina (ej: http://192.168.1.100:3001)
import { Platform } from 'react-native';

// Si estás usando un dispositivo físico, cambia esta IP por la IP de tu máquina
// Puedes obtenerla con: ipconfig (Windows) o ifconfig (Mac/Linux)
const DEVICE_IP = '192.168.1.100'; // ⚠️ CAMBIA ESTA IP POR LA DE TU MÁQUINA

const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3001' // Android emulator
    : 'http://localhost:3001' // iOS simulator
  : 'https://api.comuniapp.com'; // Para producción

// Para usar con dispositivo físico, descomenta la siguiente línea y comenta las de arriba:
// const API_BASE_URL = __DEV__ ? `http://${DEVICE_IP}:3001` : 'https://api.comuniapp.com';

// Crear instancia de axios
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token en cada request
api.interceptors.request.use(
  async (config) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // El token es inválido o expirado
      console.warn('Token inválido o expirado');
    }
    return Promise.reject(error);
  },
);

export default api;
