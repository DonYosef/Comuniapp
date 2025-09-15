# Comuniapp API

API backend para la plataforma Comuniapp desarrollada con NestJS, Prisma y PostgreSQL.

## 🏗️ Arquitectura

Este proyecto sigue los principios de **Clean Architecture** con las siguientes capas:

- **Domain**: Entidades y interfaces de repositorio
- **Application**: Casos de uso (use cases) y DTOs
- **Infrastructure**: Implementaciones de repositorios, controladores y servicios

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm
- Docker y Docker Compose (para desarrollo local)
- Cuenta en Railway (para producción)

### Instalación

1. **Instalar dependencias:**

   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**

   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Para desarrollo local:**

   ```bash
   # Levantar servicios de base de datos
   pnpm run docker:up

   # Generar cliente de Prisma
   pnpm run db:generate

   # Ejecutar migraciones
   pnpm run db:migrate

   # Poblar datos iniciales
   pnpm run db:seed

   # Iniciar servidor de desarrollo
   pnpm run dev
   ```

4. **Para producción en Railway:**
   ```bash
   # Ver RAILWAY_DEPLOYMENT.md para instrucciones detalladas
   pnpm run railway:deploy
   ```

## 📚 Documentación API

Una vez iniciado el servidor, la documentación de la API estará disponible en:

- **Swagger UI**: http://localhost:3001/api
- **JSON Schema**: http://localhost:3001/api-json

## 🗄️ Base de Datos

### Comandos Útiles

```bash
# Generar cliente de Prisma
pnpm run db:generate

# Aplicar migraciones
pnpm run db:migrate

# Resetear base de datos
pnpm run db:reset

# Poblar datos iniciales
pnpm run db:seed

# Abrir Prisma Studio
pnpm run db:studio
```

### Docker

```bash
# Levantar servicios
pnpm run docker:up

# Detener servicios
pnpm run docker:down

# Ver logs
pnpm run docker:logs
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
pnpm run test

# Ejecutar tests en modo watch
pnpm run test:watch

# Ejecutar tests con cobertura
pnpm run test:cov
```

## 📁 Estructura del Proyecto

```
src/
├── domain/                 # Capa de dominio
│   ├── entities/          # Entidades de negocio
│   └── repositories/      # Interfaces de repositorio
├── application/           # Capa de aplicación
│   ├── use-cases/        # Casos de uso
│   └── dto/              # Data Transfer Objects
├── infrastructure/        # Capa de infraestructura
│   ├── repositories/     # Implementaciones de repositorio
│   ├── controllers/      # Controladores HTTP
│   └── services/         # Servicios de infraestructura
├── config/               # Configuración
├── prisma/               # Schema y migraciones de Prisma
└── health/               # Módulo de salud
```

## 🔧 Scripts Disponibles

- `dev`: Inicia el servidor en modo desarrollo
- `build`: Compila el proyecto
- `start`: Inicia el servidor en modo producción
- `test`: Ejecuta los tests
- `lint`: Ejecuta el linter
- `db:generate`: Genera el cliente de Prisma
- `db:migrate`: Ejecuta las migraciones
- `db:seed`: Pobla datos iniciales
- `docker:up`: Levanta los servicios de Docker
- `docker:down`: Detiene los servicios de Docker

## 🛡️ Seguridad

- Validación de datos con `class-validator`
- Hash de contraseñas con `bcryptjs`
- Autenticación JWT (próximamente)
- Validación de variables de entorno con `joi`

## 📝 Notas de Desarrollo

- El proyecto está preparado para migrar a arquitectura hexagonal
- Los repositorios están desacoplados de la base de datos
- Se aplican principios SOLID y patrones de diseño
- Código completamente tipado con TypeScript
