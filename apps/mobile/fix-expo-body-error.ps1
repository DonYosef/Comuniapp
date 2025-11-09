# Script para solucionar el error "Body is unusable" en Expo CLI
Write-Host "🔧 Solucionando error 'Body is unusable' en Expo CLI..." -ForegroundColor Cyan
Write-Host ""

# 1. Limpiar caché de Expo
Write-Host "🧹 Paso 1: Limpiando caché de Expo..." -ForegroundColor Yellow
$expoCacheDirs = @(".expo", "node_modules\.cache", ".expo-shared")
foreach ($dir in $expoCacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 2. Limpiar caché de Metro
Write-Host "`n🧹 Paso 2: Limpiando caché de Metro..." -ForegroundColor Yellow
if (Test-Path "metro-cache") {
    Remove-Item -Recurse -Force "metro-cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Caché de Metro eliminado" -ForegroundColor Green
}

# 3. Limpiar caché de pnpm
Write-Host "`n🧹 Paso 3: Limpiando caché de pnpm..." -ForegroundColor Yellow
pnpm store prune -ErrorAction SilentlyContinue
Write-Host "✅ Caché de pnpm limpiado" -ForegroundColor Green

# 4. Verificar variables de entorno
Write-Host "`n⚙️ Paso 4: Configurando variables de entorno..." -ForegroundColor Yellow
Write-Host "Para evitar el error, puedes deshabilitar la validación de dependencias:" -ForegroundColor Cyan
Write-Host "  $env:EXPO_NO_DOTENV='1'" -ForegroundColor White
Write-Host "  $env:EXPO_NO_TELEMETRY='1'" -ForegroundColor White
Write-Host ""

# 5. Instrucciones para iniciar
Write-Host "🚀 Paso 5: Instrucciones para iniciar..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opción 1: Iniciar sin validación de dependencias (recomendado):" -ForegroundColor Cyan
Write-Host "  `$env:EXPO_NO_DOTENV='1'; pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "Opción 2: Iniciar con modo offline:" -ForegroundColor Cyan
Write-Host "  pnpm start --offline --clear" -ForegroundColor Green
Write-Host ""
Write-Host "Opción 3: Iniciar normalmente (puede fallar si hay problemas de red):" -ForegroundColor Cyan
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: Este error suele ocurrir por problemas de red al validar dependencias." -ForegroundColor Yellow
Write-Host "   La opción 1 o 2 deberían funcionar." -ForegroundColor Yellow
Write-Host ""

