# Script para corregir el error "Unable to resolve expo-router"
Write-Host "🔧 Corrigiendo error 'Unable to resolve expo-router'..." -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos de Metro
Write-Host "🛑 Paso 1: Deteniendo procesos de Metro..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" -or $_.CommandLine -like "*expo*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

# 2. Limpiar cachés
Write-Host "`n🧹 Paso 2: Limpiando cachés..." -ForegroundColor Yellow
$cacheDirs = @(".expo", "node_modules\.cache", "metro-cache", ".expo-shared", ".metro")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 3. Verificar que expo-router esté en package.json
Write-Host "`n📦 Paso 3: Verificando dependencias..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies.'expo-router') {
    Write-Host "✅ expo-router encontrado en package.json: $($packageJson.dependencies.'expo-router')" -ForegroundColor Green
} else {
    Write-Host "❌ expo-router NO está en package.json" -ForegroundColor Red
    Write-Host "Agregando expo-router..." -ForegroundColor Yellow
    pnpm add expo-router@~6.0.14
}

# 4. Reinstalar dependencias
Write-Host "`n📦 Paso 4: Reinstalando dependencias..." -ForegroundColor Yellow
Write-Host "Ejecutando: pnpm install" -ForegroundColor Cyan
Set-Location ..\..
pnpm install
Set-Location apps\mobile
Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green

# 5. Verificar que node_modules/expo-router existe
Write-Host "`n🔍 Paso 5: Verificando instalación..." -ForegroundColor Yellow
if (Test-Path "node_modules\expo-router") {
    Write-Host "✅ expo-router instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ expo-router NO está instalado" -ForegroundColor Red
    Write-Host "Reinstalando expo-router..." -ForegroundColor Yellow
    pnpm add expo-router@~6.0.14
}

# 6. Instrucciones finales
Write-Host "`n🚀 Paso 6: Instrucciones para reiniciar..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Reinicia Metro Bundler con caché limpia:" -ForegroundColor Cyan
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""
Write-Host "O si estás usando el script de desarrollo:" -ForegroundColor Cyan
Write-Host "  pnpm dev --clear" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: Asegúrate de detener cualquier servidor Metro antes de reiniciar" -ForegroundColor Yellow
Write-Host ""

