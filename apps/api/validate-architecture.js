#!/usr/bin/env node

/**
 * Script de Verificación de Arquitectura Clean Architecture
 * Verifica la consistencia entre entidades, DTOs, repositorios y controladores
 */

const fs = require('fs');
const path = require('path');

class ArchitectureValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.srcPath = path.join(__dirname, 'src');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Verificar que las entidades tengan campos consistentes
  validateEntityConsistency() {
    this.log('Verificando consistencia de entidades...', 'info');

    const entities = this.findFiles('domain/entities', '.entity.ts');

    entities.forEach((entityFile) => {
      const content = fs.readFileSync(entityFile, 'utf8');
      const entityName = path.basename(entityFile, '.entity.ts');

      // Verificar que el constructor tenga todos los campos necesarios
      const constructorMatch = content.match(/constructor\(\s*([^)]+)\s*\)/);
      if (constructorMatch) {
        const constructorParams = constructorMatch[1];

        // Verificar campos críticos para User
        if (entityName === 'User') {
          const requiredFields = ['phone', 'organizationId'];
          requiredFields.forEach((field) => {
            if (!constructorParams.includes(field)) {
              this.errors.push(`User entity missing field: ${field}`);
            }
          });
        }
      }
    });
  }

  // Verificar que los DTOs incluyan todos los campos de las entidades
  validateDTOCompleteness() {
    this.log('Verificando completitud de DTOs...', 'info');

    const dtos = this.findFiles('application/dto', '.dto.ts');

    dtos.forEach((dtoFile) => {
      const content = fs.readFileSync(dtoFile, 'utf8');
      const dtoName = path.basename(dtoFile, '.dto.ts');

      // Verificar DTOs de User
      if (dtoName.includes('User')) {
        const requiredFields = ['phone', 'organizationId'];
        requiredFields.forEach((field) => {
          if (!content.includes(field)) {
            this.warnings.push(`${dtoName} missing field: ${field}`);
          }
        });
      }
    });
  }

  // Verificar que los repositorios mapeen todos los campos
  validateRepositoryMapping() {
    this.log('Verificando mapeo de repositorios...', 'info');

    const repositories = this.findFiles('infrastructure/repositories', '.repository.ts');

    repositories.forEach((repoFile) => {
      const content = fs.readFileSync(repoFile, 'utf8');
      const repoName = path.basename(repoFile, '.repository.ts');

      if (repoName === 'UserRepository') {
        // Verificar método create
        if (content.includes('async create(')) {
          const requiredFields = ['phone', 'organizationId'];
          requiredFields.forEach((field) => {
            if (!content.includes(`${field}:`)) {
              this.errors.push(`UserRepository.create() missing field: ${field}`);
            }
          });
        }

        // Verificar método toDomainEntity
        if (content.includes('toDomainEntity(')) {
          const requiredFields = ['phone', 'organizationId'];
          requiredFields.forEach((field) => {
            if (!content.includes(`prismaUser.${field}`)) {
              this.errors.push(`UserRepository.toDomainEntity() missing field: ${field}`);
            }
          });
        }
      }
    });
  }

  // Verificar que no haya controladores duplicados
  validateUniqueControllers() {
    this.log('Verificando controladores únicos...', 'info');

    const controllers = this.findFiles('', '.controller.ts');
    const controllerRoutes = new Map();

    controllers.forEach((controllerFile) => {
      const content = fs.readFileSync(controllerFile, 'utf8');

      // Buscar decoradores @Controller
      const controllerMatches = content.match(/@Controller\(['"]([^'"]+)['"]\)/g);
      if (controllerMatches) {
        controllerMatches.forEach((match) => {
          const route = match.match(/['"]([^'"]+)['"]/)[1];
          if (controllerRoutes.has(route)) {
            this.errors.push(
              `Duplicate controller route: ${route} (${controllerFile} vs ${controllerRoutes.get(route)})`,
            );
          } else {
            controllerRoutes.set(route, controllerFile);
          }
        });
      }
    });
  }

  // Verificar que los Use Cases incluyan todos los campos
  validateUseCaseCompleteness() {
    this.log('Verificando completitud de Use Cases...', 'info');

    const useCases = this.findFiles('application/use-cases', '.use-case.ts');

    useCases.forEach((useCaseFile) => {
      const content = fs.readFileSync(useCaseFile, 'utf8');
      const useCaseName = path.basename(useCaseFile, '.use-case.ts');

      if (useCaseName === 'CreateUserUseCase') {
        // Verificar destructuring
        const destructuringMatch = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*createUserDto/);
        if (destructuringMatch) {
          const destructuredFields = destructuringMatch[1];
          const requiredFields = ['phone', 'organizationId'];
          requiredFields.forEach((field) => {
            if (!destructuredFields.includes(field)) {
              this.errors.push(`CreateUserUseCase missing field in destructuring: ${field}`);
            }
          });
        }
      }
    });
  }

  // Buscar archivos por patrón
  findFiles(directory, extension) {
    const fullPath = path.join(this.srcPath, directory);
    const files = [];

    if (fs.existsSync(fullPath)) {
      const items = fs.readdirSync(fullPath);
      items.forEach((item) => {
        const itemPath = path.join(fullPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          files.push(...this.findFiles(path.join(directory, item), extension));
        } else if (item.endsWith(extension)) {
          files.push(itemPath);
        }
      });
    }

    return files;
  }

  // Ejecutar todas las validaciones
  async validate() {
    this.log('Iniciando validación de arquitectura Clean Architecture...', 'info');

    try {
      this.validateEntityConsistency();
      this.validateDTOCompleteness();
      this.validateRepositoryMapping();
      this.validateUniqueControllers();
      this.validateUseCaseCompleteness();

      // Mostrar resultados
      this.log(`\n📊 Resultados de la validación:`, 'info');
      this.log(
        `   Errores encontrados: ${this.errors.length}`,
        this.errors.length > 0 ? 'error' : 'success',
      );
      this.log(
        `   Advertencias encontradas: ${this.warnings.length}`,
        this.warnings.length > 0 ? 'warning' : 'success',
      );

      if (this.errors.length > 0) {
        this.log('\n❌ Errores críticos:', 'error');
        this.errors.forEach((error) => this.log(`   - ${error}`, 'error'));
      }

      if (this.warnings.length > 0) {
        this.log('\n⚠️ Advertencias:', 'warning');
        this.warnings.forEach((warning) => this.log(`   - ${warning}`, 'warning'));
      }

      if (this.errors.length === 0 && this.warnings.length === 0) {
        this.log('\n🎉 ¡Arquitectura validada correctamente!', 'success');
      }

      return this.errors.length === 0;
    } catch (error) {
      this.log(`Error durante la validación: ${error.message}`, 'error');
      return false;
    }
  }
}

// Ejecutar validación si se llama directamente
if (require.main === module) {
  const validator = new ArchitectureValidator();
  validator.validate().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = ArchitectureValidator;
