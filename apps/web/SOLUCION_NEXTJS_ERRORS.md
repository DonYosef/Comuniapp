# 🔧 Solución para Errores de Next.js - Comuniapp

## 🚨 Problema Identificado

Los errores que estás experimentando son típicos de problemas de caché y bundling en Next.js:

```
Error: Cannot find module './175.js'
Error: ENOENT: no such file or directory, open 'routes-manifest.json'
```

## ✅ Soluciones Implementadas

### 1. **Archivos de Configuración Creados**

#### `src/pages/_document.tsx`

```typescript
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

#### `src/pages/_app.tsx`

```typescript
import type { AppProps } from 'next/app';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

### 2. **Configuración de Next.js Optimizada**

#### `next.config.js` (actualizado)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@comuniapp/types'],
  experimental: {
    optimizePackageImports: ['@comuniapp/types'],
  },
};

module.exports = nextConfig;
```

### 3. **Scripts de Solución**

#### Script de Limpieza Rápida (`quick-fix.ps1`)

- Detiene procesos de Next.js
- Limpia directorio `.next`
- Limpia caché de `node_modules`
- Reinicia el servidor de desarrollo

#### Script de Diagnóstico (`diagnose-nextjs.ps1`)

- Verifica archivos de configuración
- Verifica dependencias
- Limpia caché específico
- Proporciona recomendaciones

#### Script de Solución Completa (`fix-nextjs-errors.ps1`)

- Limpieza completa del proyecto
- Verificación de estructura de archivos
- Reinstalación de dependencias
- Build del proyecto

## 🚀 Cómo Aplicar la Solución

### Opción 1: Solución Rápida

```powershell
cd apps/web
powershell -ExecutionPolicy Bypass -File quick-fix.ps1
```

### Opción 2: Solución Completa

```powershell
cd apps/web
powershell -ExecutionPolicy Bypass -File fix-nextjs-errors.ps1
```

### Opción 3: Manual

```powershell
cd apps/web

# Limpiar caché
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Reinstalar dependencias
pnpm install

# Iniciar servidor
pnpm run dev
```

## 🔍 Causas del Problema

1. **Caché Corrupto**: El directorio `.next` contenía archivos corruptos
2. **Archivos Faltantes**: Faltaban archivos `_document.tsx` y `_app.tsx`
3. **Configuración Incorrecta**: La configuración de `transpilePackages` era demasiado compleja
4. **Dependencias Desactualizadas**: Problemas con el caché de `node_modules`

## ✅ Verificación de la Solución

Después de aplicar la solución, deberías ver:

1. **Servidor iniciado correctamente**:

   ```
   ✓ Ready in 2.3s
   ✓ Local: http://localhost:3000
   ```

2. **Sin errores de módulos faltantes**

3. **Página de login accesible** en `http://localhost:3000/login`

## 🎯 Próximos Pasos

1. **Probar el login** con las credenciales de prueba:
   - Email: `admin.lospinos@comuniapp.com`
   - Contraseña: `123456`

2. **Verificar la sección de avisos** en el sidebar

3. **Probar la funcionalidad** de crear, editar y eliminar avisos

## 🛠️ Prevención de Problemas Futuros

1. **Siempre usar `pnpm`** en lugar de `npm` (el proyecto usa workspaces)
2. **Limpiar caché regularmente** cuando haya problemas
3. **Verificar la configuración** de `next.config.js` antes de cambios importantes
4. **Mantener archivos de configuración** como `_document.tsx` y `_app.tsx`

---

**¡Los errores deberían estar solucionados!** 🎉

Si persisten los problemas, ejecuta el script de diagnóstico para obtener más información específica.
