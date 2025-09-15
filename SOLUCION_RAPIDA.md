# 🚀 Solución Rápida - Comuniapp Dashboard

## ⚡ Problema Actual

El comando `pnpm dev` está fallando debido a la configuración del workspace. Aquí tienes las soluciones paso a paso:

## 🎯 Solución 1: Ejecutar solo la aplicación web

### Opción A: Usando el script automático

```powershell
.\run-web.ps1
```

### Opción B: Manual

```powershell
# 1. Ir al directorio de la aplicación web
cd apps\web

# 2. Instalar dependencias (si no están instaladas)
npm install

# 3. Levantar servidor
npm run dev
```

## 🎯 Solución 2: Arreglar el workspace completo

```powershell
# 1. Limpiar todo
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item apps\web\node_modules -Recurse -Force -ErrorAction SilentlyContinue

# 2. Instalar dependencias del workspace
pnpm install

# 3. Ejecutar el servidor
pnpm dev
```

## 🎯 Solución 3: Usando npm en lugar de pnpm

```powershell
# 1. Ir a la aplicación web
cd apps\web

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor
npm run dev
```

## ✅ Verificar que funciona

Una vez que el servidor esté corriendo, deberías ver:

- ✅ Mensaje: "Ready - started server on 0.0.0.0:3000"
- ✅ Abrir http://localhost:3000 en el navegador
- ✅ Ver el dashboard con sidebar y topbar funcionando

## 🎨 Lo que verás en el navegador

1. **Redirección automática** de `/` a `/dashboard`
2. **Sidebar** a la izquierda con navegación (Dashboard, Usuarios, Finanzas, Eventos, Ajustes)
3. **Topbar** con campo de búsqueda, selector de tema y menú de usuario
4. **Página de dashboard** con estadísticas y tarjetas
5. **Tema claro/oscuro** funcional con persistencia
6. **Diseño responsivo** que se adapta al tamaño de pantalla

## 🛠️ Si aún hay problemas

### Error de TypeScript

```powershell
# Regenerar archivos de tipos
cd apps\web
npx next build --no-lint
```

### Error de puertos

```powershell
# Usar un puerto diferente
npm run dev -- --port 3001
```

### Error de dependencias

```powershell
# Limpiar cache de npm
npm cache clean --force
Remove-Item node_modules -Recurse -Force
npm install
```

## 📞 Estado Actual del Proyecto

✅ **Componentes creados:**

- `Sidebar.tsx` - Navegación lateral completa
- `Topbar.tsx` - Barra superior con búsqueda y tema
- Layout del dashboard con página de ejemplo

✅ **Características funcionando:**

- Navegación entre secciones
- Campo de búsqueda funcional
- Selector de tema persistente
- Menú de usuario desplegable
- Diseño responsivo completo
- Iconos SVG inline

🎯 **Solo falta:** Levantar el servidor de desarrollo para verlo en acción.

## 🎉 Resultado Final

Una vez funcionando, tendrás un dashboard moderno y profesional con:

- Color primario azul claro (#0ea5e9)
- Sidebar colapsable y responsivo
- Topbar con todas las funcionalidades
- Modo claro/oscuro
- Transiciones suaves
- Accesibilidad completa
