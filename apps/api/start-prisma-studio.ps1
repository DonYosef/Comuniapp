# Script para iniciar Prisma Studio en Windows
# Uso: .\start-prisma-studio.ps1

Write-Host "🚀 Iniciando Prisma Studio..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el archivo .env existe
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "   Por favor, crea el archivo .env desde env.example" -ForegroundColor Yellow
    exit 1
}

# Verificar que la base de datos está corriendo
$dockerStatus = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null
if (-not $dockerStatus) {
    Write-Host "⚠️  Advertencia: No se encontró el contenedor de PostgreSQL corriendo" -ForegroundColor Yellow
    Write-Host "   Ejecuta: pnpm docker:up" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar si Prisma Studio ya está corriendo
$portCheck = netstat -ano | findstr :5555
if ($portCheck) {
    Write-Host "⚠️  El puerto 5555 está en uso." -ForegroundColor Yellow
    Write-Host "   Prisma Studio podría estar corriendo en: http://localhost:5555" -ForegroundColor Cyan
    Write-Host ""
    $response = Read-Host "¿Deseas abrir el navegador ahora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Start-Process "http://localhost:5555"
    }
    exit 0
}

Write-Host "📊 Prisma Studio se iniciará en: http://localhost:5555" -ForegroundColor Green
Write-Host "   El navegador se abrirá automáticamente en unos segundos..." -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener Prisma Studio" -ForegroundColor Yellow
Write-Host ""

# Iniciar Prisma Studio en segundo plano
$job = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location $workingDir
    pnpm db:studio
} -ArgumentList (Get-Location).Path

# Esperar a que Prisma Studio inicie
Write-Host "⏳ Esperando a que Prisma Studio inicie..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

# Verificar si el puerto está activo
$portCheck = netstat -ano | findstr :5555
if ($portCheck) {
    Write-Host "✅ Prisma Studio está corriendo!" -ForegroundColor Green
    Write-Host ""
    
    # Abrir el navegador
    Start-Process "http://localhost:5555"
    
    Write-Host "🌐 Navegador abierto en http://localhost:5555" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para detener Prisma Studio, presiona cualquier tecla..." -ForegroundColor Yellow
    
    # Esperar a que el usuario presione una tecla
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Detener el trabajo
    Stop-Job $job.Id -ErrorAction SilentlyContinue
    Remove-Job $job.Id -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "✅ Prisma Studio detenido" -ForegroundColor Green
} else {
    Write-Host "❌ Error: No se pudo iniciar Prisma Studio" -ForegroundColor Red
    Write-Host "   Verifica los logs del trabajo:" -ForegroundColor Yellow
    Write-Host "   Receive-Job $($job.Id)" -ForegroundColor Cyan
    Stop-Job $job.Id -ErrorAction SilentlyContinue
    Remove-Job $job.Id -ErrorAction SilentlyContinue
    exit 1
}
