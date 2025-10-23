# Solución rápida para errores de Next.js
Write-Host "🚀 Solución rápida para errores de Next.js" -ForegroundColor Green

# Detener cualquier proceso de Next.js que esté corriendo
Write-Host "🛑 Deteniendo procesos de Next.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpiar directorio .next
Write-Host "🧹 Limpiando directorio .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Directorio .next eliminado" -ForegroundColor Green
}

# Limpiar caché de node_modules
Write-Host "🧹 Limpiando caché..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Caché eliminado" -ForegroundColor Green
}

# Iniciar servidor de desarrollo
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host "Ejecutando: pnpm run dev" -ForegroundColor Cyan

# Ejecutar en background
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -NoNewWindow

Write-Host "`n✅ Servidor iniciado!" -ForegroundColor Green
Write-Host "El servidor debería estar disponible en: http://localhost:3000" -ForegroundColor Cyan
