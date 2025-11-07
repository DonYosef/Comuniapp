# Solución al Error 401 (Unauthorized)

## 🔍 Diagnóstico del Problema

El error 401 indica que las credenciales son incorrectas o que no se puede conectar a la API. Sigue estos pasos para solucionarlo:

## ✅ Pasos para Solucionar

### 1. Verificar que la API esté corriendo

Abre una terminal y ejecuta:

```bash
cd apps/api
pnpm dev
```

O si estás usando npm:

```bash
cd apps/api
npm run dev
```

La API debe estar corriendo en `http://localhost:3001`

### 2. Verificar las credenciales

Las credenciales correctas son:

- **Email**: `admin@comuniapp.com`
- **Contraseña**: `admin123`

⚠️ **Nota**: Si usaste el seed de prueba, las contraseñas pueden ser `123456` para algunos usuarios.

### 3. Verificar la configuración de la API

Si estás usando un **emulador de Android**:

- La URL debe ser: `http://10.0.2.2:3001` ✅ (ya configurado)

Si estás usando un **simulador de iOS**:

- La URL debe ser: `http://localhost:3001` ✅ (ya configurado)

Si estás usando un **dispositivo físico** (Android o iOS):

1. Obtén la IP de tu máquina:
   - **Windows**: Abre PowerShell y ejecuta `ipconfig`, busca "IPv4 Address"
   - **Mac/Linux**: Ejecuta `ifconfig` o `ip addr`, busca la IP de tu red local
2. Edita `apps/mobile/src/config/api.ts`:

   ```typescript
   // Cambia esta línea:
   const DEVICE_IP = '192.168.1.100'; // ⚠️ CAMBIA ESTA IP

   // Y descomenta esta línea:
   const API_BASE_URL = __DEV__ ? `http://${DEVICE_IP}:3001` : 'https://api.comuniapp.com';
   ```

### 4. Verificar que el backend tenga CORS configurado

Asegúrate de que el backend permita conexiones desde la app móvil. En `apps/api/src/main.ts` debe tener:

```typescript
app.enableCors({
  origin: true, // O especifica los orígenes permitidos
  credentials: true,
});
```

### 5. Probar la conexión manualmente

Puedes probar si la API responde ejecutando en tu navegador o con curl:

```bash
curl http://localhost:3001/health
```

O prueba el login directamente:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comuniapp.com","password":"admin123"}'
```

## 🐛 Errores Comunes

### Error: "Network Error" o "ECONNREFUSED"

- **Causa**: La API no está corriendo o la URL está mal configurada
- **Solución**: Verifica los pasos 1 y 3

### Error: "401 Unauthorized"

- **Causa**: Credenciales incorrectas
- **Solución**: Verifica el paso 2

### Error: "CORS policy"

- **Causa**: El backend no permite conexiones desde la app móvil
- **Solución**: Verifica el paso 4

## 📝 Credenciales de Prueba

### Super Admin

- Email: `admin@comuniapp.com`
- Contraseña: `admin123`

### Residentes (si usaste seed de prueba)

- Email: `carlos.rodriguez@email.com`
- Contraseña: `123456`

## 🔧 Configuración Rápida para Dispositivo Físico

1. Obtén tu IP local (ejemplo: `192.168.1.50`)
2. Edita `apps/mobile/src/config/api.ts`:
   ```typescript
   const DEVICE_IP = '192.168.1.50'; // Tu IP
   const API_BASE_URL = __DEV__ ? `http://${DEVICE_IP}:3001` : 'https://api.comuniapp.com';
   ```
3. Asegúrate de que tu dispositivo y tu computadora estén en la misma red WiFi
4. Reinicia la app móvil

## ✅ Verificación Final

Si todo está correcto, deberías poder:

1. Ver la pantalla de login
2. Ingresar las credenciales
3. Ver el dashboard después del login

Si sigues teniendo problemas, revisa los logs de la consola de la app móvil para más detalles del error.
