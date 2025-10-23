# Script de diagnóstico y solución para errores de Next.js
Write-Host "🔍 Diagnosticando errores de Next.js..." -ForegroundColor Cyan

# Verificar si existe el directorio .next
if (Test-Path ".next") {
    Write-Host "❌ Directorio .next existe - eliminando..." -ForegroundColor Red
    Remove-Item -Recurse -Force ".next"
} else {
    Write-Host "✅ Directorio .next no existe" -ForegroundColor Green
}

# Verificar archivos de configuración
Write-Host "`n📋 Verificando archivos de configuración..." -ForegroundColor Cyan

if (Test-Path "next.config.js") {
    Write-Host "✅ next.config.js existe" -ForegroundColor Green
} else {
    Write-Host "❌ next.config.js no existe" -ForegroundColor Red
}

if (Test-Path "package.json") {
    Write-Host "✅ package.json existe" -ForegroundColor Green
} else {
    Write-Host "❌ package.json no existe" -ForegroundColor Red
}

# Verificar dependencias críticas
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Cyan

$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasNext = $packageJson.dependencies.PSObject.Properties.Name -contains "next"
$hasReact = $packageJson.dependencies.PSObject.Properties.Name -contains "react"

if ($hasNext) {
    Write-Host "✅ Next.js está instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Next.js no está instalado" -ForegroundColor Red
}

if ($hasReact) {
    Write-Host "✅ React está instalado" -ForegroundColor Green
} else {
    Write-Host "❌ React no está instalado" -ForegroundColor Red
}

# Limpiar caché específico
Write-Host "`n🧹 Limpiando caché específico..." -ForegroundColor Cyan

# Limpiar caché de Next.js
if (Test-Path "node_modules\.next") {
    Remove-Item -Recurse -Force "node_modules\.next"
    Write-Host "✅ Caché de Next.js eliminado" -ForegroundColor Green
}

# Limpiar caché de webpack
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Caché de webpack eliminado" -ForegroundColor Green
}

Write-Host "`n🚀 Intentando iniciar servidor de desarrollo..." -ForegroundColor Cyan
Write-Host "Si los errores persisten, puede ser necesario:" -ForegroundColor Yellow
Write-Host "1. Verificar imports en los archivos de página" -ForegroundColor Yellow
Write-Host "2. Revisar la configuración de TypeScript" -ForegroundColor Yellow
Write-Host "3. Verificar que todos los archivos de página tengan la estructura correcta" -ForegroundColor Yellow
