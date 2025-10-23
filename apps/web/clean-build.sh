#!/bin/bash

echo "🧹 Limpiando proyecto Next.js..."

# Limpiar caché de Next.js
echo "📁 Eliminando directorio .next..."
rm -rf .next

# Limpiar caché de node_modules
echo "📁 Limpiando caché de node_modules..."
rm -rf node_modules/.cache

# Limpiar caché de npm
echo "📁 Limpiando caché de npm..."
npm cache clean --force

# Reinstalar dependencias
echo "📦 Reinstalando dependencias..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Rebuild del proyecto
echo "🔨 Reconstruyendo proyecto..."
npm run build

echo "✅ Limpieza completada!"
