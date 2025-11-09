# Script para solucionar el error de ReanimatedModule en Android
Write-Host "🔧 Solucionando error de ReanimatedModule en Android..." -ForegroundColor Cyan
Write-Host ""

# 1. Limpiar caché de Metro
Write-Host "🧹 Paso 1: Limpiando caché de Metro..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "✅ Caché de Expo eliminado" -ForegroundColor Green
}

# 2. Limpiar build de Android
Write-Host "`n🧹 Paso 2: Limpiando build de Android..." -ForegroundColor Yellow
$androidDirs = @("android\app\build", "android\.gradle", "android\build")
foreach ($dir in $androidDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 3. Verificar configuración de Babel
Write-Host "`n⚙️ Paso 3: Verificando configuración de Babel..." -ForegroundColor Yellow
$babelConfig = Get-Content "babel.config.js" -Raw
if ($babelConfig -match "react-native-reanimated/plugin") {
    Write-Host "✅ Plugin de Reanimated configurado en Babel" -ForegroundColor Green
} else {
    Write-Host "❌ Plugin de Reanimated NO está configurado" -ForegroundColor Red
    Write-Host "   Agrega 'react-native-reanimated/plugin' a babel.config.js" -ForegroundColor Yellow
}

# 4. Verificar que react-native-reanimated esté instalado
Write-Host "`n📦 Paso 4: Verificando dependencias..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies.'react-native-reanimated') {
    Write-Host "✅ react-native-reanimated instalado: $($packageJson.dependencies.'react-native-reanimated')" -ForegroundColor Green
} else {
    Write-Host "❌ react-native-reanimated NO está instalado" -ForegroundColor Red
    Write-Host "   Ejecuta: pnpm add react-native-reanimated" -ForegroundColor Yellow
}

# 5. Instrucciones para reconstruir
Write-Host "`n🚀 Paso 5: Instrucciones para reconstruir la app..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para solucionar el error de ReanimatedModule, necesitas reconstruir la app Android:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Detén el servidor de desarrollo (Ctrl+C)" -ForegroundColor White
Write-Host "2. Ejecuta uno de estos comandos:" -ForegroundColor White
Write-Host "   - npx expo run:android --clear" -ForegroundColor Green
Write-Host "   - pnpm android (si está configurado)" -ForegroundColor Green
Write-Host ""
Write-Host "3. Si el error persiste, limpia completamente:" -ForegroundColor White
Write-Host "   - npx expo prebuild --clean" -ForegroundColor Green
Write-Host "   - npx expo run:android" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: En Expo Go, react-native-reanimated puede no funcionar correctamente." -ForegroundColor Yellow
Write-Host "   Es mejor usar un build de desarrollo (expo run:android)" -ForegroundColor Yellow
Write-Host ""

