# Instrucciones para levantar el proyecto Comuniapp Dashboard

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **pnpm** (gestor de paquetes)
- **Git**

## 🚀 Pasos para levantar el proyecto

### 1. Clonar e instalar dependencias

```bash
# Si no has clonado el repositorio aún
git clone <tu-repositorio>
cd Comuniapp

# Instalar todas las dependencias del workspace
pnpm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo de variables de entorno
cp apps/api/env.example apps/api/.env

# Editar el archivo .env con tus configuraciones
# (Opcional por ahora, ya que solo estamos trabajando con el frontend)
```

### 3. Levantar el servidor de desarrollo

```bash
# Desde la raíz del proyecto, ejecutar:
pnpm dev

# O si prefieres levantar solo la aplicación web:
cd apps/web
pnpm dev
```

### 4. Abrir en el navegador

Una vez que el servidor esté corriendo, abre tu navegador y ve a:

```
http://localhost:3000
```

La aplicación te redirigirá automáticamente al dashboard en `/dashboard`.

## 🎨 Características implementadas

### Sidebar

- ✅ Navegación vertical con iconos SVG inline
- ✅ Secciones: Dashboard, Usuarios, Finanzas, Eventos, Ajustes
- ✅ Modo colapsado para pantallas pequeñas
- ✅ Tooltips en modo colapsado
- ✅ Estados activos y hover
- ✅ Transiciones suaves

### Topbar

- ✅ Campo de búsqueda centrado
- ✅ Avatar de usuario con menú desplegable
- ✅ Selector de tema (claro/oscuro) persistente
- ✅ Botón de notificaciones
- ✅ Botón de menú móvil
- ✅ Responsive design

### Layout del Dashboard

- ✅ Layout responsivo con sidebar fijo
- ✅ Overlay para móvil
- ✅ Página de ejemplo con estadísticas
- ✅ Redirección automática desde la raíz

### Estilos

- ✅ Color primario azul claro (#0ea5e9)
- ✅ Modo oscuro/claro con persistencia
- ✅ Transiciones suaves
- ✅ Scrollbar personalizado
- ✅ Fuentes del sistema optimizadas

## 🛠️ Estructura de archivos creados

```
apps/web/src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx          # Componente de navegación lateral
│       └── Topbar.tsx           # Componente de barra superior
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Layout del dashboard
│   │   └── page.tsx             # Página principal del dashboard
│   ├── globals.css              # Estilos globales actualizados
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Redirección al dashboard
```

## 🎯 Funcionalidades

### Navegación

- **Dashboard**: Página principal con estadísticas
- **Usuarios**: Gestión de usuarios (ruta: `/dashboard/usuarios`)
- **Finanzas**: Gestión financiera (ruta: `/dashboard/finanzas`)
- **Eventos**: Gestión de eventos (ruta: `/dashboard/eventos`)
- **Ajustes**: Configuración (ruta: `/dashboard/ajustes`)

### Interacciones

- **Búsqueda**: Campo de búsqueda funcional (consola)
- **Tema**: Cambio entre modo claro y oscuro
- **Menú usuario**: Dropdown con opciones de perfil
- **Sidebar**: Colapso/expansión en móvil y desktop

## 🔧 Comandos útiles

```bash
# Desarrollo
pnpm dev                    # Levantar todo el workspace
pnpm dev --filter web       # Solo la aplicación web

# Construcción
pnpm build                  # Construir todo
pnpm build --filter web     # Solo la aplicación web

# Linting
pnpm lint                   # Lint de todo el workspace
pnpm lint --filter web      # Solo la aplicación web

# Type checking
pnpm typecheck              # Verificar tipos de TypeScript
```

## 🐛 Solución de problemas

### Error de política de ejecución de PowerShell

Si encuentras errores relacionados con la política de ejecución de PowerShell:

```powershell
# Ejecutar como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error de dependencias

Si hay problemas con las dependencias:

```bash
# Limpiar cache y reinstalar
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Puerto ocupado

Si el puerto 3000 está ocupado:

```bash
# El servidor automáticamente usará el siguiente puerto disponible
# O puedes especificar un puerto:
pnpm dev --port 3001
```

## 📱 Responsive Design

La aplicación está optimizada para:

- **Móvil**: < 768px (sidebar colapsado, menú hamburguesa)
- **Tablet**: 768px - 1024px (sidebar colapsado opcional)
- **Desktop**: > 1024px (sidebar expandido por defecto)

## 🎨 Personalización

### Cambiar color primario

Edita `apps/web/src/app/globals.css` y cambia la variable `--primary`:

```css
:root {
  --primary: #tu-color-aqui;
}
```

### Añadir nuevas secciones

Edita `apps/web/src/components/layout/Sidebar.tsx` y añade elementos al array `navItems`.

¡Listo! Tu dashboard de Comuniapp está funcionando. 🎉
