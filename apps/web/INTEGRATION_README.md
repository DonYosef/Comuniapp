# 🔗 Integración Frontend-Backend - Comuniapp

## ✅ **Estado de la Integración**

La integración entre el frontend (Next.js) y el backend (NestJS) está **COMPLETA** para el módulo de Residentes/Usuarios.

## 🚀 **Cómo Probar la Integración**

### **1. Levantar el Backend**

```bash
# Ir al directorio del backend
cd apps/api

# Instalar dependencias
pnpm install

# Levantar PostgreSQL con Docker
pnpm run docker:up

# Generar cliente de Prisma
pnpm run db:generate

# Ejecutar migraciones
pnpm run db:migrate

# Poblar datos iniciales
pnpm run db:seed

# Levantar el servidor
pnpm run dev
```

**El backend estará disponible en:** http://localhost:3001

### **2. Levantar el Frontend**

```bash
# Ir al directorio del frontend
cd apps/web

# Instalar dependencias
pnpm install

# Levantar el servidor de desarrollo
pnpm run dev
```

**El frontend estará disponible en:** http://localhost:3000

### **3. Probar la Integración**

1. **Abrir el navegador** en http://localhost:3000
2. **Navegar** a `/dashboard/residentes`
3. **Verificar** que se cargan los usuarios del backend
4. **Probar las operaciones CRUD:**
   - ✅ **Crear** un nuevo usuario
   - ✅ **Ver** detalles de un usuario
   - ✅ **Editar** un usuario existente
   - ✅ **Eliminar** un usuario
   - ✅ **Filtrar** por estado
   - ✅ **Buscar** usuarios

## 🔧 **Funcionalidades Implementadas**

### **Frontend (Next.js)**

- ✅ **React Query** para manejo de estado del servidor
- ✅ **Axios** para comunicación HTTP
- ✅ **Hooks personalizados** para operaciones CRUD
- ✅ **Componentes UI** reutilizables (Loading, Error)
- ✅ **Modal** para crear/editar/ver usuarios
- ✅ **Validación** de formularios
- ✅ **Manejo de errores** y estados de carga
- ✅ **Filtros** y búsqueda

### **Backend (NestJS)**

- ✅ **API REST** completa para usuarios
- ✅ **Clean Architecture** implementada
- ✅ **Validación** con class-validator
- ✅ **Documentación** con Swagger
- ✅ **Base de datos** PostgreSQL con Prisma
- ✅ **Seed** de datos iniciales

## 📊 **Endpoints Disponibles**

| Método | Endpoint     | Descripción                |
| ------ | ------------ | -------------------------- |
| GET    | `/users`     | Obtener todos los usuarios |
| GET    | `/users/:id` | Obtener usuario por ID     |
| POST   | `/users`     | Crear nuevo usuario        |
| PATCH  | `/users/:id` | Actualizar usuario         |
| DELETE | `/users/:id` | Eliminar usuario           |

## 🗄️ **Estructura de Datos**

### **Usuario (User)**

```typescript
{
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 🔍 **Verificación de la Integración**

### **1. Verificar Backend**

- ✅ Swagger disponible en: http://localhost:3001/api
- ✅ Health check en: http://localhost:3001/health
- ✅ Usuarios en: http://localhost:3001/users

### **2. Verificar Frontend**

- ✅ Página de residentes carga datos del backend
- ✅ Operaciones CRUD funcionan correctamente
- ✅ Estados de carga y error se muestran
- ✅ Filtros y búsqueda funcionan

### **3. Verificar Base de Datos**

- ✅ Usuarios se crean/actualizan/eliminan en PostgreSQL
- ✅ Datos persisten entre reinicios
- ✅ Relaciones funcionan correctamente

## 🐛 **Solución de Problemas**

### **Error: "Can't reach database server"**

```bash
# Verificar que Docker esté corriendo
pnpm run docker:up

# Verificar que PostgreSQL esté activo
pnpm run docker:logs
```

### **Error: "Network Error" en el frontend**

```bash
# Verificar que el backend esté corriendo
curl http://localhost:3001/health

# Verificar la URL de la API en el frontend
# Debe ser: http://localhost:3001
```

### **Error: "Module not found"**

```bash
# Reinstalar dependencias
pnpm install

# Limpiar cache
pnpm run build
```

## 🎯 **Próximos Pasos**

1. **Implementar autenticación** JWT
2. **Agregar más módulos** (Comunidades, Unidades, etc.)
3. **Implementar roles y permisos**
4. **Agregar tests** unitarios e integración
5. **Optimizar rendimiento** con paginación
6. **Agregar notificaciones** en tiempo real

## 📝 **Notas Técnicas**

- **Frontend**: Next.js 15 + React Query + Tailwind CSS
- **Backend**: NestJS + Prisma + PostgreSQL
- **Monorepo**: Turborepo + pnpm
- **Arquitectura**: Clean Architecture + SOLID principles
- **Validación**: class-validator + React Hook Form
- **Estado**: React Query para servidor, useState para local
