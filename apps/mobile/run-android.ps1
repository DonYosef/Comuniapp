# Script para ejecutar la app en Android (emulador o dispositivo)
Write-Host "📱 Ejecutando app en Android..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ No se encontró package.json" -ForegroundColor Red
    Write-Host "Asegúrate de estar en el directorio apps/mobile" -ForegroundColor Yellow
    exit 1
}

# Verificar que hay un dispositivo/emulador disponible
Write-Host "🔍 Verificando dispositivos disponibles..." -ForegroundColor Yellow
$devicesOutput = adb devices 2>&1
$devices = $devicesOutput | Select-String "device$"

if ($devices.Count -eq 0) {
    Write-Host "❌ No hay dispositivos o emuladores conectados" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "  1. Inicia un emulador desde Android Studio:" -ForegroundColor Cyan
    Write-Host "     - Tools > Device Manager > Create/Start Device" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. O conecta un dispositivo físico:" -ForegroundColor Cyan
    Write-Host "     - Habilita 'USB Debugging' en el dispositivo" -ForegroundColor White
    Write-Host "     - Conecta por USB" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. O inicia un emulador desde línea de comandos:" -ForegroundColor Cyan
    Write-Host "     emulator -list-avds" -ForegroundColor White
    Write-Host "     emulator -avd <nombre-del-avd>" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Dispositivo(s) encontrado(s):" -ForegroundColor Green
$devices | ForEach-Object {
    Write-Host "  - $($_.Line)" -ForegroundColor White
}

Write-Host ""
Write-Host "🚀 Ejecutando app..." -ForegroundColor Yellow
Write-Host "Esto puede tardar varios minutos la primera vez..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar
npx expo run:android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ App ejecutada correctamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Error al ejecutar la app" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta:" -ForegroundColor Yellow
    Write-Host "  1. Limpiar y reconstruir: npx expo run:android --clear" -ForegroundColor Cyan
    Write-Host "  2. Verificar que el emulador esté completamente iniciado" -ForegroundColor Cyan
    Write-Host "  3. Revisar los logs de error arriba" -ForegroundColor Cyan
}

