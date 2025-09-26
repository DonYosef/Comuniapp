# 🏗️ Guía de Desarrollo - Clean Architecture

## 📋 Scripts de Validación

### 1. **Validación de Arquitectura**

```bash
# Verificar consistencia de la arquitectura Clean Architecture
node validate-architecture.js
```

**Qué verifica:**

- Consistencia entre entidades, DTOs y repositorios
- Campos faltantes en mapeos
- Controladores duplicados
- Completitud de Use Cases

### 2. **Prueba Rápida de Funcionalidad**

```bash
# Probar creación completa de usuarios
node quick-test.js
```

**Qué prueba:**

- Login y autenticación
- Creación de usuarios con todos los campos
- Verificación en base de datos
- Limpieza automática

### 3. **Verificación de Base de Datos**

```bash
# Verificar campos guardados en BD (usar quick-test.js que incluye verificación de BD)
pnpm run test:quick
```

## 🚨 Señales de Alerta

### **Campos `null` en Base de Datos**

```bash
# Síntoma: phone y organizationId aparecen como null
# Causa: Repositorio no mapea correctamente
# Solución: Verificar UserRepository.create() y toDomainEntity()
```

### **Campos Faltantes en Respuesta API**

```bash
# Síntoma: Campos no aparecen en la respuesta
# Causa: DTO de respuesta incompleto
# Solución: Verificar UserResponseDto y toResponseDto()
```

### **Errores de TypeScript**

```bash
# Síntoma: "Expected X arguments, but got Y"
# Causa: Instanciaciones de entidades desactualizadas
# Solución: Actualizar todos los constructores de User
```

## 🔧 Proceso de Desarrollo

### **Agregar Nuevo Campo a Entidad**

1. **Actualizar Entidad de Dominio**

   ```typescript
   // apps/api/src/domain/entities/user.entity.ts
   constructor(
     // ... campos existentes
     public readonly newField: string | null, // ← NUEVO CAMPO
   ) {}

   static create(
     // ... parámetros existentes
     newField: string | null = null, // ← NUEVO PARÁMETRO
   ): User {
     return new User(
       // ... campos existentes
       newField, // ← NUEVO CAMPO
     );
   }
   ```

2. **Actualizar DTOs**

   ```typescript
   // apps/api/src/application/dto/create-user.dto.ts
   @IsOptional()
   @IsString()
   newField?: string; // ← NUEVO CAMPO

   // apps/api/src/application/dto/user-response.dto.ts
   @ApiProperty({ description: 'Nuevo campo', required: false })
   newField?: string; // ← NUEVO CAMPO
   ```

3. **Actualizar Use Case**

   ```typescript
   // apps/api/src/application/use-cases/create-user.use-case.ts
   const { email, name, password, status, organizationId, phone, newField } = createUserDto;
   const user = User.create(email, name, passwordHash, organizationId, status, phone, newField);
   ```

4. **Actualizar Repositorio**

   ```typescript
   // apps/api/src/infrastructure/repositories/user.repository.ts
   async create(user: User): Promise<User> {
     const created = await this.prisma.user.create({
       data: {
         // ... campos existentes
         newField: user.newField, // ← NUEVO CAMPO
       },
     });
   }

   private toDomainEntity(prismaUser: any): User {
     return new User(
       // ... campos existentes
       prismaUser.newField || null, // ← NUEVO CAMPO
     );
   }
   ```

5. **Actualizar Controlador**

   ```typescript
   // apps/api/src/infrastructure/controllers/users.controller.ts
   private toResponseDto(user: User): UserResponseDto {
     return {
       // ... campos existentes
       newField: user.newField, // ← NUEVO CAMPO
     };
   }
   ```

6. **Actualizar Servicios**

   ```typescript
   // Buscar todas las instanciaciones de User
   grep -r "new User(" apps/api/src/
   // Actualizar cada una para incluir el nuevo campo
   ```

7. **Verificar Cambios**
   ```bash
   # Ejecutar validaciones
   node validate-architecture.js
   node quick-test.js
   ```

## 🎯 Checklist de Desarrollo

### **Antes de Hacer Commit**

- [ ] `node validate-architecture.js` - Sin errores
- [ ] `node quick-test.js` - Prueba exitosa
- [ ] `pnpm run build` - Sin errores de TypeScript
- [ ] Campos aparecen en respuesta de API
- [ ] Campos se guardan en base de datos

### **Después de Agregar Campo**

- [ ] Entidad de dominio actualizada
- [ ] DTOs actualizados
- [ ] Use Case actualizado
- [ ] Repositorio actualizado
- [ ] Controlador actualizado
- [ ] Servicios actualizados
- [ ] Tests actualizados

## 🚀 Comandos Útiles

### **Debugging de Arquitectura**

```bash
# Verificar qué controlador se ejecuta
grep -r "@Controller" apps/api/src/

# Buscar instanciaciones de entidades
grep -r "new User(" apps/api/src/

# Verificar campos en DTOs
grep -r "phone\|organizationId" apps/api/src/application/dto/

# Verificar mapeo en repositorios
grep -r "phone\|organizationId" apps/api/src/infrastructure/repositories/
```

### **Testing**

```bash
# Prueba completa (incluye creación, verificación de BD y limpieza)
pnpm run test:quick
```

## 📚 Recursos

- **Reglas de Arquitectura**: `.cursor/rules/clean-architecture-rules.mdc`
- **Script de Validación**: `validate-architecture.js`
- **Prueba Rápida**: `quick-test.js`
- **Pre-commit Hook**: `pre-commit-hook.sh`

---

**💡 Tip**: Ejecuta `node quick-test.js` después de cada cambio arquitectónico para verificar que todo funciona correctamente.
