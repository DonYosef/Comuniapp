# Script completo para corregir errores de react-native-reanimated y layout
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
$cacheDirs = @(".expo", "node_modules\.cache", "metro-cache", ".expo-shared", "android\.gradle", "android\app\build", "android\build")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 3. Limpiar node_modules y reinstalar
Write-Host "`n📦 Paso 3: Limpiando e reinstalando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "✅ node_modules eliminado" -ForegroundColor Green
}

# 4. Ir al directorio raíz para reinstalar
Write-Host "`n📦 Paso 4: Reinstalando desde raíz del workspace..." -ForegroundColor Yellow
Set-Location ..\..
pnpm install
Set-Location apps\mobile
Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green

# 5. Verificar configuración de Babel
Write-Host "`n⚙️ Paso 5: Verificando configuración de Babel..." -ForegroundColor Yellow
$babelConfig = Get-Content "babel.config.js" -Raw
if ($babelConfig -match "react-native-reanimated/plugin") {
    Write-Host "✅ Plugin de reanimated configurado en Babel" -ForegroundColor Green
} else {
    Write-Host "❌ Plugin de reanimated NO está configurado" -ForegroundColor Red
}

# 6. Verificar imports
Write-Host "`n📝 Paso 6: Verificando imports..." -ForegroundColor Yellow
$layoutContent = Get-Content "app\_layout.tsx" -Raw
if ($layoutContent -match "react-native-reanimated") {
    Write-Host "✅ Import de reanimated encontrado en _layout.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ Import de reanimated NO encontrado" -ForegroundColor Red
}

# 7. Instrucciones finales
Write-Host "`n🚀 Paso 7: Instrucciones para reconstruir Android..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para corregir el error de ReanimatedModule, ejecuta:" -ForegroundColor Cyan
Write-Host "  npx expo run:android --clear" -ForegroundColor Green
Write-Host ""
Write-Host "O si prefieres usar Expo Go (sin módulos nativos):" -ForegroundColor Cyan
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: El error de ReanimatedModule requiere una reconstrucción completa" -ForegroundColor Yellow
Write-Host "   de la app Android. Expo Go no soporta módulos nativos personalizados." -ForegroundColor Yellow
Write-Host ""

