# Comuniapp

Aplicación de comunidades construida con un stack moderno de TypeScript.

## 🏗️ Arquitectura

Este proyecto utiliza un **monorepo** con las siguientes tecnologías:

- **Frontend Web**: Next.js 15+ con App Router y Tailwind CSS
- **Frontend Móvil**: React Native con Expo
- **Backend**: NestJS con Prisma ORM
- **Base de datos**: PostgreSQL
- **Cache**: Redis
- **Gestión de paquetes**: pnpm
- **Monorepo**: Turborepo
- **Lenguaje**: TypeScript en todo el stack

## 📁 Estructura del proyecto

```
comuniapp/
├── apps/
│   ├── web/          # Next.js (App Router)
│   ├── mobile/       # React Native + Expo
│   └── api/          # NestJS + Prisma
├── packages/
│   ├── ui/           # Componentes compartidos
│   ├── types/        # Tipos y esquemas compartidos
│   ├── config/       # Configuraciones (ESLint, Prettier, TSConfig)
│   └── utils/        # Utilidades comunes
├── contracts/        # OpenAPI y contratos
├── infra/           # Docker Compose
└── .github/         # GitHub Actions
```

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js 20+
- pnpm 8+
- Docker y Docker Compose

### 1. Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd comuniapp

# Instalar dependencias
pnpm install
```

### 2. Configurar la base de datos

#### 2.1 Levantar servicios de infraestructura

```bash
# Levantar PostgreSQL y Redis con Docker
docker compose -f infra/docker-compose.yml up -d

# Verificar que los servicios estén corriendo
docker ps
```

**Verificación:** Deberías ver los contenedores `comuniapp-postgres` y `comuniapp-redis` corriendo.

#### 2.2 Configurar variables de entorno

```bash
# Navegar a la API y copiar variables de entorno
cd apps/api
cp env.example .env
```

**Archivo `.env` creado:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comuniapp"
NODE_ENV=development
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"
```

#### 2.3 Configurar Prisma y base de datos

```bash
# Generar cliente de Prisma
pnpm prisma generate

# Ejecutar migraciones (crea todas las tablas)
pnpm prisma migrate dev --name init

# Poblar base de datos con datos iniciales
pnpm prisma db seed

# Regresar al directorio raíz
cd ../..
```

**¿Qué se crea automáticamente?**

- ✅ **14 entidades principales**: Organizations, Communities, Users, Units, Expenses, etc.
- ✅ **6 roles del sistema**: SUPER_ADMIN, COMMUNITY_ADMIN, CONCIERGE, OWNER, TENANT, RESIDENT
- ✅ **Usuario administrador**: `admin@comuniapp.com` / `admin123`
- ✅ **Organización demo**: Comuniapp Demo

**Verificación:**

```bash
# Abrir Prisma Studio para ver los datos
cd apps/api
pnpm prisma studio
```

Se abre en http://localhost:5555

### 3. Ejecutar en desarrollo

```bash
# Ejecutar todas las aplicaciones en paralelo
pnpm dev
```

Esto iniciará:

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api
- **Mobile**: Expo DevTools

## 📋 Scripts disponibles

### Scripts globales (raíz del proyecto)

```bash
pnpm dev          # Ejecutar todas las apps en desarrollo
pnpm build        # Construir todas las aplicaciones
pnpm lint         # Ejecutar linting en todo el proyecto
pnpm test         # Ejecutar tests
pnpm typecheck    # Verificar tipos TypeScript
```

### Scripts por aplicación

```bash
# Web (Next.js)
cd apps/web
pnpm dev          # Desarrollo
pnpm build        # Construcción
pnpm start        # Producción

# Mobile (Expo)
cd apps/mobile
pnpm dev          # Desarrollo
pnpm android      # Android
pnpm ios          # iOS
pnpm web          # Web

# API (NestJS)
cd apps/api
pnpm start:dev    # Desarrollo
pnpm build        # Construcción
pnpm start:prod   # Producción
```

## 🗄️ Base de datos

### Comandos de Prisma

```bash
cd apps/api

# Generar cliente de Prisma
pnpm prisma generate

# Crear y aplicar migración
pnpm prisma migrate dev --name <nombre-migracion>

# Aplicar migraciones (producción)
pnpm prisma migrate deploy

# Poblar base de datos con datos iniciales
pnpm prisma db seed

# Abrir Prisma Studio (interfaz visual)
pnpm prisma studio

# Resetear base de datos completamente
pnpm prisma migrate reset

# Sincronizar schema sin migración
pnpm prisma db push

# Ver estado de migraciones
pnpm prisma migrate status
```

### Estructura de la Base de Datos

**Entidades principales creadas automáticamente:**

- **Organizations** - Organizaciones que usan el sistema
- **Communities** - Comunidades dentro de organizaciones
- **Users** - Usuarios del sistema con roles y permisos
- **Units** - Unidades dentro de comunidades
- **Expenses** - Gastos comunes de la comunidad
- **Payments** - Pagos de gastos por parte de usuarios
- **Visitors** - Visitantes registrados en la comunidad
- **Parcels** - Encomiendas recibidas
- **Announcements** - Anuncios de la comunidad
- **Documents** - Documentos compartidos
- **Communications** - Comunicaciones entre usuarios
- **SpaceReservations** - Reservas de espacios comunes
- **Incidents** - Incidencias reportadas por usuarios

**Roles del sistema:**

- **SUPER_ADMIN**: Acceso total al sistema
- **COMMUNITY_ADMIN**: Administrador de comunidad
- **CONCIERGE**: Personal de conserjería
- **OWNER**: Propietario de unidad
- **TENANT**: Arrendatario
- **RESIDENT**: Residente

### Variables de entorno

Copia `apps/api/env.example` a `apps/api/.env` y configura:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comuniapp"
NODE_ENV=development
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"
```

### Usuario Administrador por Defecto

Después del seed, tienes acceso con:

- **Email**: `admin@comuniapp.com`
- **Contraseña**: `admin123`
- **Rol**: SUPER_ADMIN
- **Permisos**: Acceso total al sistema

### Solución de Problemas Comunes

**Error: "Database connection failed"**

```bash
# Verificar que Docker esté corriendo
docker ps

# Reiniciar servicios si es necesario
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d
```

**Error: "Migration failed"**

```bash
# Resetear base de datos y aplicar migraciones
pnpm prisma migrate reset
pnpm prisma migrate dev --name init
```

**Error: "Prisma Client not generated"**

```bash
# Limpiar y regenerar cliente
rm -rf node_modules/@prisma/client
pnpm prisma generate
```

**Error: "Seed failed"**

```bash
# Limpiar datos y ejecutar seed
pnpm prisma migrate reset
pnpm prisma db seed
```

## 🛠️ Herramientas de desarrollo

### Linting y formateo

- **ESLint**: Configuración centralizada en `packages/config/eslint.base.cjs`
- **Prettier**: Configuración en `packages/config/prettier.config.cjs`
- **Husky**: Hooks de Git para pre-commit y commit-msg
- **lint-staged**: Ejecuta linting solo en archivos modificados

### Commits

El proyecto utiliza [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorizar código
test: agregar tests
chore: tareas de mantenimiento
```

### Branches

- `main`: Rama principal de producción
- `develop`: Rama de desarrollo
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Corrección de bugs
- `hotfix/*`: Correcciones urgentes

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests con watch mode
pnpm test:watch

# Tests con cobertura
pnpm test:cov

# Tests e2e
pnpm test:e2e
```

## 🚀 Despliegue

### CI/CD

El proyecto incluye GitHub Actions para:

- **CI**: Linting, type checking, tests y build en cada PR
- **Deploy**: Despliegue automático desde `main`

### Infraestructura

Los servicios de desarrollo se ejecutan con Docker Compose:

```bash
# Levantar servicios
docker compose -f infra/docker-compose.yml up -d

# Ver logs
docker compose -f infra/docker-compose.yml logs -f

# Detener servicios
docker compose -f infra/docker-compose.yml down
```

## 📚 Documentación

- **API**: Documentación automática en http://localhost:3001/api
- **Contratos**: Especificación OpenAPI en `contracts/openapi.yaml`
- **Componentes**: Documentación de componentes compartidos en `packages/ui/`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**¡Happy coding! 🎉**
