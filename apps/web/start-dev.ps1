# Script para iniciar el servidor de desarrollo de Next.js
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Green

# Verificar si estamos en el directorio correcto
if (!(Test-Path "src/app/page.tsx")) {
    Write-Host "❌ No se encontró el archivo src/app/page.tsx" -ForegroundColor Red
    Write-Host "Asegúrate de estar en el directorio apps/web" -ForegroundColor Yellow
    exit 1
}

# Intentar diferentes métodos para ejecutar Next.js
Write-Host "Intentando método 1: npx next dev" -ForegroundColor Yellow
try {
    npx next@latest dev
} catch {
    Write-Host "Método 1 falló, intentando método 2..." -ForegroundColor Yellow
    
    # Instalar dependencias si es necesario
    if (!(Test-Path "node_modules")) {
        Write-Host "Instalando dependencias..." -ForegroundColor Cyan
        npm install
    }
    
    # Intentar con npm run dev
    npm run dev
}
