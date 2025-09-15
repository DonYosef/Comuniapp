# Script para configurar el proyecto Comuniapp Dashboard
# Ejecutar como administrador si es necesario

Write-Host "🚀 Configurando Comuniapp Dashboard..." -ForegroundColor Green

# Cambiar política de ejecución temporalmente
Write-Host "📝 Configurando política de ejecución..." -ForegroundColor Yellow
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Para levantar el proyecto, ejecuta:" -ForegroundColor Cyan
    Write-Host "   pnpm dev" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Luego abre http://localhost:3000 en tu navegador" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar manualmente: pnpm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Para más información, consulta INSTRUCCIONES_DASHBOARD.md" -ForegroundColor Blue
