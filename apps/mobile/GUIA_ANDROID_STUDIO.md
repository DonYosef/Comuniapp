# 📱 Guía: Ejecutar App en Android Studio

## ✅ Sí, puedes usar Android Studio con `npx expo run:android`

Cuando ejecutas `npx expo run:android`, Expo construye la app nativa y puede:

1. **Instalar automáticamente** en un emulador/dispositivo conectado
2. **Abrir el proyecto** en Android Studio para ejecutarlo manualmente

## 🚀 Opciones para Ejecutar

### Opción 1: Ejecutar Directamente (Recomendado)

```powershell
cd apps/mobile

# Esto construirá y ejecutará automáticamente en el emulador/dispositivo conectado
npx expo run:android
```

**Requisitos:**

- ✅ Emulador de Android iniciado (desde Android Studio o línea de comandos)
- ✅ O dispositivo físico conectado con USB debugging habilitado

### Opción 2: Solo Construir y Abrir en Android Studio

```powershell
cd apps/mobile

# Construir el proyecto nativo
npx expo prebuild

# Abrir en Android Studio
# El proyecto estará en: apps/mobile/android
```

Luego en Android Studio:

1. Abre `apps/mobile/android` como proyecto
2. Espera a que Gradle sincronice
3. Selecciona un emulador o dispositivo
4. Presiona el botón ▶️ "Run" (o Shift+F10)

### Opción 3: Construir y Ejecutar con Opciones

```powershell
cd apps/mobile

# Construir y ejecutar en un dispositivo específico
npx expo run:android --device

# Construir y ejecutar en un emulador específico
npx expo run:android --device "emulator-5554"

# Solo construir sin ejecutar (útil para abrir en Android Studio después)
npx expo run:android --no-build-cache
```

## 📋 Pasos Detallados para Android Studio

### 1. Preparar el Proyecto

```powershell
cd apps/mobile

# Pre-build del proyecto (genera la carpeta android/)
npx expo prebuild

# O si ya existe, solo limpiar y reconstruir
npx expo run:android --no-install
```

### 2. Abrir en Android Studio

1. Abre **Android Studio**
2. Selecciona **"Open"** o **"File > Open"**
3. Navega a: `C:\capstone\Comuniapp\apps\mobile\android`
4. Espera a que Android Studio:
   - Sincronice Gradle
   - Descargue dependencias
   - Indexe el proyecto

### 3. Configurar el Emulador

Si no tienes un emulador:

1. En Android Studio: **Tools > Device Manager**
2. Clic en **"Create Device"**
3. Selecciona un dispositivo (ej: Pixel 5)
4. Selecciona una imagen del sistema (ej: API 33, Android 13)
5. Clic en **"Finish"**

### 4. Ejecutar la App

1. En Android Studio, selecciona el emulador/dispositivo en la barra superior
2. Presiona el botón ▶️ **"Run"** (o `Shift+F10`)
3. O desde la terminal integrada: `./gradlew installDebug`

## 🔧 Configuración Recomendada

### Verificar que el Emulador Esté Corriendo

```powershell
# Listar dispositivos/emuladores disponibles
adb devices

# Deberías ver algo como:
# List of devices attached
# emulator-5554   device
```

### Iniciar Emulador desde Línea de Comandos

```powershell
# Listar AVDs disponibles
emulator -list-avds

# Iniciar un emulador específico
emulator -avd "Pixel_5_API_33"
```

## ⚙️ Scripts Útiles

### Script para Abrir en Android Studio

```powershell
# Crear script: open-android-studio.ps1
cd apps/mobile
npx expo prebuild
Start-Process "C:\Program Files\Android\Android Studio\bin\studio64.exe" -ArgumentList "android"
```

### Script para Ejecutar Directamente

```powershell
# Crear script: run-android.ps1
cd apps/mobile

# Verificar que hay un emulador/dispositivo
$devices = adb devices
if ($devices -match "device$") {
    Write-Host "✅ Dispositivo encontrado, ejecutando..." -ForegroundColor Green
    npx expo run:android
} else {
    Write-Host "❌ No hay dispositivos conectados" -ForegroundColor Red
    Write-Host "Inicia un emulador desde Android Studio o conecta un dispositivo" -ForegroundColor Yellow
}
```

## 🐛 Solución de Problemas

### Error: "No devices found"

**Solución:**

```powershell
# Verificar dispositivos
adb devices

# Si no hay dispositivos, inicia un emulador desde Android Studio
# O conecta un dispositivo físico con USB debugging habilitado
```

### Error: "Gradle sync failed"

**Solución:**

```powershell
cd apps/mobile/android
.\gradlew clean
cd ..
npx expo prebuild --clean
```

### Error: "Build failed"

**Solución:**

```powershell
cd apps/mobile
Remove-Item -Recurse -Force android\app\build, android\build -ErrorAction SilentlyContinue
npx expo run:android --clear
```

## 📝 Notas Importantes

1. **Primera vez**: `npx expo prebuild` genera la carpeta `android/` si no existe
2. **Módulos nativos**: `react-native-reanimated` requiere una build nativa (no funciona en Expo Go)
3. **Sincronización**: Android Studio sincroniza Gradle automáticamente al abrir el proyecto
4. **Hot Reload**: Funciona normalmente cuando ejecutas desde Android Studio
5. **Metro Bundler**: Se inicia automáticamente con `npx expo run:android`, pero puedes iniciarlo manualmente con `pnpm start`

## 🎯 Resumen Rápido

```powershell
# Opción más simple: Ejecutar directamente
cd apps/mobile
npx expo run:android

# Si quieres usar Android Studio:
cd apps/mobile
npx expo prebuild
# Luego abre android/ en Android Studio y presiona Run
```
