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

```bash
# Levantar servicios de infraestructura
docker compose -f infra/docker-compose.yml up -d

# Configurar variables de entorno para la API
cd apps/api
cp env.example .env

# Ejecutar migraciones de Prisma
pnpm prisma migrate dev --name init
pnpm prisma generate
cd ../..
```

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

# Crear migración
pnpm prisma migrate dev --name <nombre-migracion>

# Aplicar migraciones
pnpm prisma migrate deploy

# Generar cliente
pnpm prisma generate

# Abrir Prisma Studio
pnpm prisma studio

# Resetear base de datos
pnpm prisma migrate reset
```

### Variables de entorno

Copia `apps/api/env.example` a `apps/api/.env` y configura:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/comuniapp"
NODE_ENV=development
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
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
