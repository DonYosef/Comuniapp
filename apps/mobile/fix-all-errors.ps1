# Script completo para corregir todos los errores
Write-Host "🔧 Solución completa para errores de ReanimatedModule y Layout" -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos
Write-Host "🛑 Paso 1: Deteniendo procesos..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Metro*" -or $_.CommandLine -like "*expo*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*gradle*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

# 2. Limpiar cachés
Write-Host "`n🧹 Paso 2: Limpiando cachés..." -ForegroundColor Yellow
$cacheDirs = @(".expo", "node_modules\.cache", "metro-cache", ".expo-shared")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 3. Limpiar build de Android
Write-Host "`n🧹 Paso 3: Limpiando build de Android..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
    Write-Host "✅ Build de Android eliminado" -ForegroundColor Green
}
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build" -ErrorAction SilentlyContinue
    Write-Host "✅ Build raíz de Android eliminado" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle" -ErrorAction SilentlyContinue
    Write-Host "✅ Caché de Gradle eliminado" -ForegroundColor Green
}

# 4. Reinstalar dependencias
Write-Host "`n📦 Paso 4: Reinstalando dependencias..." -ForegroundColor Yellow
Write-Host "Ejecutando: pnpm install" -ForegroundColor Cyan
Set-Location ..\..
pnpm install
Set-Location apps\mobile
Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green

# 5. Verificar archivos
Write-Host "`n📝 Paso 5: Verificando archivos críticos..." -ForegroundColor Yellow

# Verificar _layout.tsx
$layoutContent = Get-Content "app\_layout.tsx" -Raw
if ($layoutContent -match "export default") {
    Write-Host "✅ _layout.tsx tiene export default" -ForegroundColor Green
} else {
    Write-Host "❌ _layout.tsx NO tiene export default" -ForegroundColor Red
}

# Verificar babel.config.js
$babelConfig = Get-Content "babel.config.js" -Raw
if ($babelConfig -match "react-native-reanimated/plugin") {
    Write-Host "✅ Plugin de reanimated configurado en Babel" -ForegroundColor Green
} else {
    Write-Host "❌ Plugin de reanimated NO está configurado" -ForegroundColor Red
}

# 6. Instrucciones finales
Write-Host "`n🚀 Paso 6: Instrucciones para reconstruir..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para corregir el error de ReanimatedModule, ejecuta:" -ForegroundColor Cyan
Write-Host "  npx expo run:android --clear" -ForegroundColor Green
Write-Host ""
Write-Host "O inicia Metro con caché limpia:" -ForegroundColor Cyan
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: El error de ReanimatedModule requiere una reconstrucción" -ForegroundColor Yellow
Write-Host "   completa de la app Android. No funcionará en Expo Go." -ForegroundColor Yellow
Write-Host ""

