import { Button } from '@comuniapp/ui';
import { formatDate } from '@comuniapp/utils';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Alert } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Comuniapp</Text>
      <Text style={styles.subtitle}>
        Aplicación de comunidades construida con Next.js, React Native y NestJS
      </Text>
      <Button
        label={`Botón compartido - ${formatDate(new Date())}`}
        onPress={() => Alert.alert('¡Hola!', '¡Hola desde la app móvil!')}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
});
