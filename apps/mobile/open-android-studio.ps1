# Script para abrir el proyecto en Android Studio
Write-Host "🚀 Preparando proyecto para Android Studio..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ No se encontró package.json" -ForegroundColor Red
    Write-Host "Asegúrate de estar en el directorio apps/mobile" -ForegroundColor Yellow
    exit 1
}

# 1. Pre-build del proyecto (genera la carpeta android/)
Write-Host "📦 Paso 1: Generando proyecto nativo..." -ForegroundColor Yellow
npx expo prebuild --platform android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar el proyecto nativo" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Proyecto nativo generado" -ForegroundColor Green

# 2. Verificar que existe la carpeta android
if (!(Test-Path "android")) {
    Write-Host "❌ No se generó la carpeta android/" -ForegroundColor Red
    exit 1
}

# 3. Buscar Android Studio
Write-Host "`n🔍 Paso 2: Buscando Android Studio..." -ForegroundColor Yellow

$androidStudioPaths = @(
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe",
    "$env:ProgramFiles\Android\Android Studio\bin\studio64.exe",
    "$env:ProgramFiles(x86)\Android\Android Studio\bin\studio64.exe",
    "$env:USERPROFILE\AppData\Local\Programs\Android Studio\bin\studio64.exe"
)

$studioPath = $null
foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        $studioPath = $path
        break
    }
}

if ($null -eq $studioPath) {
    Write-Host "⚠️  Android Studio no encontrado en ubicaciones comunes" -ForegroundColor Yellow
    Write-Host "Abre Android Studio manualmente y selecciona:" -ForegroundColor Cyan
    Write-Host "  $(Resolve-Path 'android')" -ForegroundColor Green
    Write-Host ""
    Write-Host "O instala Android Studio desde: https://developer.android.com/studio" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Android Studio encontrado: $studioPath" -ForegroundColor Green

# 4. Abrir Android Studio
Write-Host "`n🚀 Paso 3: Abriendo Android Studio..." -ForegroundColor Yellow
$androidPath = Resolve-Path "android"
Start-Process $studioPath -ArgumentList $androidPath

Write-Host "✅ Android Studio abierto" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos en Android Studio:" -ForegroundColor Cyan
Write-Host "  1. Espera a que Gradle sincronice (puede tardar varios minutos la primera vez)" -ForegroundColor White
Write-Host "  2. Selecciona un emulador o dispositivo en la barra superior" -ForegroundColor White
Write-Host "  3. Presiona el botón ▶️ 'Run' (o Shift+F10) para ejecutar la app" -ForegroundColor White
Write-Host ""

