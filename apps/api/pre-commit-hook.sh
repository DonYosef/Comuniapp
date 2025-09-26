# Pre-commit Hook Configuration
# Ejecuta validaciones de arquitectura antes de cada commit

# Archivo: .git/hooks/pre-commit
#!/bin/bash

echo "🔍 Ejecutando validaciones de arquitectura..."

# Cambiar al directorio de la API
cd apps/api

# Verificar que el backend esté ejecutándose
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "⚠️  Backend no está ejecutándose en localhost:3001"
    echo "   Ejecuta 'pnpm dev' antes de hacer commit"
    exit 1
fi

# Ejecutar validación de arquitectura
echo "📋 Validando arquitectura Clean Architecture..."
if ! node validate-architecture.js; then
    echo "❌ Validación de arquitectura falló"
    echo "   Revisa los errores y corrige antes de hacer commit"
    exit 1
fi

# Ejecutar prueba rápida
echo "🧪 Ejecutando prueba rápida de creación de usuarios..."
if ! node quick-test.js; then
    echo "❌ Prueba rápida falló"
    echo "   El flujo de creación de usuarios no funciona correctamente"
    exit 1
fi

echo "✅ Todas las validaciones pasaron correctamente"
echo "🚀 Commit autorizado"
