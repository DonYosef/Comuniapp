# Script para eliminar completamente react-native-reanimated
Write-Host "🗑️ Eliminando react-native-reanimated completamente..." -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos
Write-Host "🛑 Paso 1: Deteniendo procesos..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*metro*" -or 
    $_.CommandLine -like "*expo*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

# 2. Eliminar de node_modules local
Write-Host "`n🗑️ Paso 2: Eliminando de node_modules local..." -ForegroundColor Yellow
if (Test-Path "node_modules\react-native-reanimated") {
    Remove-Item -Recurse -Force "node_modules\react-native-reanimated" -ErrorAction SilentlyContinue
    Write-Host "✅ Eliminado de node_modules local" -ForegroundColor Green
} else {
    Write-Host "✅ No existe en node_modules local" -ForegroundColor Green
}

# 3. Eliminar de pnpm store (desde raíz del workspace)
Write-Host "`n🗑️ Paso 3: Eliminando de pnpm store..." -ForegroundColor Yellow
Set-Location ..\..
$pnpmStore = Get-ChildItem "node_modules\.pnpm" -Filter "react-native-reanimated*" -ErrorAction SilentlyContinue
if ($pnpmStore) {
    foreach ($item in $pnpmStore) {
        Remove-Item -Recurse -Force $item.FullName -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $($item.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No existe en pnpm store" -ForegroundColor Green
}
Set-Location apps\mobile

# 4. Limpiar todos los cachés
Write-Host "`n🧹 Paso 4: Limpiando cachés..." -ForegroundColor Yellow
$cacheDirs = @(".expo", "metro-cache", ".metro", ".expo-shared", "node_modules\.cache")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Eliminado: $dir" -ForegroundColor Green
    }
}

# 5. Reinstalar dependencias
Write-Host "`n📦 Paso 5: Reinstalando dependencias..." -ForegroundColor Yellow
Set-Location ..\..
pnpm install
Set-Location apps\mobile
Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green

# 6. Verificar que no existe
Write-Host "`n🔍 Paso 6: Verificando eliminación..." -ForegroundColor Yellow
if (Test-Path "node_modules\react-native-reanimated") {
    Write-Host "❌ react-native-reanimated todavía existe" -ForegroundColor Red
} else {
    Write-Host "✅ react-native-reanimated eliminado correctamente" -ForegroundColor Green
}

Write-Host "`n🚀 Paso 7: Reinicia Metro con caché limpia:" -ForegroundColor Yellow
Write-Host "  pnpm start --clear" -ForegroundColor Green
Write-Host ""

