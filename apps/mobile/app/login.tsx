import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@comuniapp.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/');
    } catch (err: any) {
      console.error('Error en login:', err);

      // Manejar diferentes tipos de errores
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError(
          'No se puede conectar al servidor. Verifica que la API esté corriendo en http://localhost:3001',
        );
      } else if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading si ya está autenticado
  if (isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#F0F9FF', '#E0F2FE', '#BAE6FD', '#93C5FD']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header con icono y título */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#0ea5e9', '#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>🏢</Text>
                </LinearGradient>
              </View>

              <LinearGradient
                colors={['#0ea5e9', '#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>Iniciar Sesión</Text>
              </LinearGradient>

              <Text style={styles.subtitle}>Comuniapp - Gestión de Comunidades</Text>
            </View>

            {/* Card del formulario */}
            <View style={styles.card}>
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#0ea5e9', '#3b82f6', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonText}>Iniciar Sesión</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 Credenciales de prueba</Text>
                    <Text style={styles.infoText}>
                      <Text style={styles.infoLabel}>Email:</Text> admin@comuniapp.com
                    </Text>
                    <Text style={styles.infoText}>
                      <Text style={styles.infoLabel}>Contraseña:</Text> admin123
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 40,
  },
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.1)',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '700',
    color: '#0ea5e9',
  },
});
