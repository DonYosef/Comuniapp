# 🏗️ Arquitectura del Backend - Comuniapp

## 📋 Estructura General

Este proyecto sigue los principios de **Clean Architecture** y **SOLID**, separando las responsabilidades en capas bien definidas.

## 🗂️ Organización de Directorios

```
src/
├── application/          # Capa de Aplicación
│   ├── dto/             # Data Transfer Objects
│   └── use-cases/       # Casos de uso del negocio
│
├── domain/              # Capa de Dominio
│   ├── entities/        # Entidades del negocio
│   └── repositories/    # Interfaces de repositorios
│
├── infrastructure/      # Capa de Infraestructura
│   ├── controllers/     # Controladores HTTP (ÚNICOS)
│   └── repositories/    # Implementaciones de repositorios
│
├── auth/                # Módulo de autenticación
├── prisma/              # Configuración de Prisma ORM
│
└── [feature-modules]/   # Módulos específicos por funcionalidad
    ├── admin/           # Endpoints de administración del sistema
    ├── residents/       # Endpoints específicos para residentes
    ├── concierge/       # Endpoints específicos para porteros
    ├── communities/     # Gestión de comunidades
    ├── common-expenses/ # Gestión de gastos comunes
    └── organizations/   # Gestión de organizaciones
```

## 🎯 Responsabilidades por Capa

### 1️⃣ **Domain (Dominio)**

- **Qué contiene**: Entidades de negocio e interfaces de repositorios
- **Dependencias**: NINGUNA (capa más interna)
- **Propósito**: Definir las reglas de negocio puras

```typescript
// Ejemplo: domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    // ...
  ) {}
}

// Ejemplo: domain/repositories/user.repository.interface.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  // ...
}
```

### 2️⃣ **Application (Aplicación)**

- **Qué contiene**: Use Cases y DTOs
- **Dependencias**: Solo del dominio
- **Propósito**: Orquestar la lógica de negocio

```typescript
// Ejemplo: application/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // Lógica de negocio aquí
    return this.userRepository.create(user);
  }
}
```

### 3️⃣ **Infrastructure (Infraestructura)**

- **Qué contiene**: Controladores y repositorios concretos
- **Dependencias**: Aplicación y Dominio
- **Propósito**: Implementar detalles técnicos

```typescript
// Ejemplo: infrastructure/controllers/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return this.getAllUsersUseCase.execute();
  }
}
```

## ⚠️ REGLAS IMPORTANTES

### ✅ **QUÉ HACER**

1. **Un solo controlador por recurso** → `infrastructure/controllers/users.controller.ts`
2. **Use Cases para lógica de negocio** → `application/use-cases/`
3. **DTOs en application** → `application/dto/`
4. **Interfaces en domain** → `domain/repositories/`
5. **Implementaciones en infrastructure** → `infrastructure/repositories/`

### ❌ **QUÉ NO HACER**

1. **NO crear controladores fuera de `infrastructure/controllers/`** (excepto módulos específicos como admin, residents, concierge)
2. **NO duplicar DTOs** en diferentes carpetas
3. **NO crear servicios genéricos** - usar Use Cases
4. **NO mezclar lógica de negocio en controladores** - debe estar en Use Cases
5. **NO importar Prisma directamente en Use Cases** - usar repositorios

## 🔄 Flujo de Datos

```
Cliente HTTP
    ↓
[Controller] (infrastructure/controllers/)
    ↓
[Use Case] (application/use-cases/)
    ↓
[Repository Interface] (domain/repositories/)
    ↓
[Repository Implementation] (infrastructure/repositories/)
    ↓
[Prisma ORM]
    ↓
[Base de Datos]
```

## 📦 Módulos Especiales

Algunos módulos tienen controladores propios porque representan **contextos de negocio específicos**:

- **`admin/`**: Endpoints de administración del sistema (métricas, salud, etc.)
- **`residents/`**: Endpoints específicos para residentes (mis unidades, mis gastos, etc.)
- **`concierge/`**: Endpoints específicos para porteros (gestión de visitantes, paquetes, etc.)
- **`auth/`**: Autenticación y autorización

Estos módulos **NO duplican** la funcionalidad de `users`, sino que proporcionan **funcionalidades específicas del contexto**.

## 🧪 Testing

- **Unit Tests**: Para Use Cases
- **Integration Tests**: Para Controladores
- **E2E Tests**: Para flujos completos

## 📚 Recursos

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Última actualización**: $(Get-Date -Format "yyyy-MM-dd")
