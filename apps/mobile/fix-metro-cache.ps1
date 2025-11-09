# Script para limpiar caché de Metro y resolver errores de módulos
Write-Host "🔧 Limpiando caché de Metro y corrigiendo errores..." -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos de Metro/Expo
Write-Host "🛑 Paso 1: Deteniendo procesos..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*metro*" -or 
    $_.CommandLine -like "*expo*" -or 
    $_.MainWindowTitle -like "*Metro*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

# 2. Limpiar todos los cachés
Write-Host "`n🧹 Paso 2: Limpiando cachés..." -ForegroundColor Yellow
$cacheDirs = @(".expo", "metro-cache", ".metro", ".expo-shared", "node_modules\.cache")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 3. Limpiar watchman (si está instalado)
Write-Host "`n🧹 Paso 3: Limpiando Watchman..." -ForegroundColor Yellow
try {
    watchman watch-del-all 2>$null
    Write-Host "✅ Watchman limpiado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Watchman no está instalado (opcional)" -ForegroundColor Yellow
}

# 4. Verificar dependencias
Write-Host "`n📦 Paso 4: Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules\expo-router") {
    Write-Host "✅ expo-router instalado" -ForegroundColor Green
} else {
    Write-Host "❌ expo-router NO instalado, reinstalando..." -ForegroundColor Red
    Set-Location ..\..
    pnpm install
    Set-Location apps\mobile
}

# 5. Instrucciones finales
Write-Host "`n🚀 Paso 5: Reinicia Metro con caché limpia:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "O si estás usando el script de desarrollo:" -ForegroundColor Cyan
Write-Host "  pnpm dev --clear" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Asegúrate de que no haya procesos de Metro corriendo" -ForegroundColor Yellow
Write-Host "   antes de reiniciar. Presiona Ctrl+C si hay alguno activo." -ForegroundColor Yellow
Write-Host ""

