# Script de limpieza para Windows PowerShell
Write-Host "🧹 Limpiando proyecto Next.js..." -ForegroundColor Green

# Limpiar caché de Next.js
Write-Host "📁 Eliminando directorio .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Limpiar caché de node_modules
Write-Host "📁 Limpiando caché de node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

# Limpiar caché de npm
Write-Host "📁 Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

# Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}
npm install

# Rebuild del proyecto
Write-Host "🔨 Reconstruyendo proyecto..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Limpieza completada!" -ForegroundColor Green
