# Script simple para levantar solo la aplicación web
Write-Host "🚀 Iniciando aplicación web Comuniapp..." -ForegroundColor Green

# Cambiar al directorio de la aplicación web
Set-Location "apps\web"

# Instalar dependencias si es necesario
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Levantar servidor de desarrollo
Write-Host "🌐 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host "Abre http://localhost:3000 en tu navegador" -ForegroundColor Green
npm run dev
