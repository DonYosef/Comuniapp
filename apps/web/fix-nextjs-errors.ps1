# Solución específica para errores de módulos faltantes en Next.js
Write-Host "🔧 Solucionando errores de módulos faltantes en Next.js..." -ForegroundColor Cyan

# 1. Limpiar completamente el proyecto
Write-Host "`n🧹 Paso 1: Limpieza completa..." -ForegroundColor Yellow

# Eliminar directorios de caché
$cacheDirs = @(".next", "node_modules\.cache", "node_modules\.next")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 2. Verificar estructura de archivos
Write-Host "`n📁 Paso 2: Verificando estructura de archivos..." -ForegroundColor Yellow

$requiredFiles = @(
    "src/pages/_app.tsx",
    "src/pages/_document.tsx",
    "src/app/globals.css",
    "next.config.js",
    "package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Existe: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Falta: $file" -ForegroundColor Red
    }
}

# 3. Verificar configuración de Next.js
Write-Host "`n⚙️ Paso 3: Verificando configuración..." -ForegroundColor Yellow

$nextConfig = Get-Content "next.config.js" -Raw
if ($nextConfig -match "transpilePackages") {
    Write-Host "✅ transpilePackages configurado" -ForegroundColor Green
} else {
    Write-Host "❌ transpilePackages no configurado" -ForegroundColor Red
}

# 4. Reinstalar dependencias
Write-Host "`n📦 Paso 4: Reinstalando dependencias..." -ForegroundColor Yellow
pnpm install

# 5. Intentar build
Write-Host "`n🔨 Paso 5: Intentando build..." -ForegroundColor Yellow
Write-Host "Ejecutando: pnpm run build" -ForegroundColor Cyan

# Ejecutar build en background para no bloquear
Start-Process -FilePath "pnpm" -ArgumentList "run", "build" -NoNewWindow -Wait

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
Write-Host "Si los errores persisten, puede ser necesario:" -ForegroundColor Yellow
Write-Host "1. Verificar que todos los imports sean correctos" -ForegroundColor Yellow
Write-Host "2. Revisar la configuración de TypeScript" -ForegroundColor Yellow
Write-Host "3. Verificar que no haya archivos corruptos" -ForegroundColor Yellow
